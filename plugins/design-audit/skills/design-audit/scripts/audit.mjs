#!/usr/bin/env node
// Audit one URL: axe-core (desktop), page measurements, AI-look signals, text repetition,
// design measurements and pixel measures of the first viewport, screenshots, a scroll series and
// load-animation frames, each for desktop and mobile.
// Usage: node audit.mjs <url> <output-dir>
// Output: <output-dir>/audit.json { url, notes, desktop, mobile } plus the PNG files it names.
import { chromium, devices } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { focusWalk } from './focus-walk.mjs';
import { scrollSeriesPositions } from './lib/scroll.mjs';
import { finishMeasure } from './lib/post.mjs';
import { finishDesign } from './lib/design.mjs';
import { runDesignScripts } from './design-scripts.mjs';
import { pixelReport } from './pixels.mjs';
import { scrollWholePage, waitForSettled } from './page-prep.mjs';
import { evaluateAtViewport } from './lib/viewport.mjs';
import { LATE_REFERENCE_MS } from './lib/late-content.mjs';

const FRAME_TIMES_MS = [300, 1000, 2500];
const MOBILE_DEVICE = 'iPhone 13';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
	console.error('Usage: node audit.mjs <url> <output-dir>');
	process.exit(2);
}
mkdirSync(out, { recursive: true });

const here = dirname(fileURLToPath(import.meta.url));
const measureSource = readFileSync(join(here, 'measure.js'), 'utf8');
const snapshotSource = readFileSync(join(here, 'snapshot-first-viewport.js'), 'utf8');
const measure = async (page) => finishMeasure(await evaluateAtViewport(page, measureSource));

// Screenshots use CSS pixels: a 3x device would otherwise exceed Chromium's image size limit on long pages.
const shot = (page, file, options = {}) => page.screenshot({ path: join(out, file), scale: 'css', ...options });

/** Same keys for every viewport, so consumers never branch on the viewport name. */
function emptyViewport(name, contextOptions) {
	return {
		viewport: contextOptions.viewport,
		device: name === 'mobile' ? MOBILE_DEVICE : null,
		userAgent: null,
		status: null,
		timing: null,
		frames: [],
		fullPage: null,
		scrollHeight: null,
		scrollShots: [],
		measure: null,
		design: null,
		pixels: null,
		focus: null,
		axe: null,
		axeIncomplete: null
	};
}

async function auditViewport(browser, name, contextOptions, notes) {
	const result = emptyViewport(name, contextOptions);
	const context = await browser.newContext(contextOptions);
	try {
		const page = await context.newPage();
		result.userAgent = await page.evaluate(() => navigator.userAgent).catch(() => null);

		// Animation frames from first paint, before the page has settled. `atMs` is the real capture time.
		const start = Date.now();
		let loadEventMs = null;
		let earlySnapshot = null;
		page.once('load', () => {
			loadEventMs = Date.now() - start;
		});
		const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
		result.status = response?.status() ?? null;
		const domContentLoadedMs = Date.now() - start;
		for (const t of FRAME_TIMES_MS) {
			await page.waitForTimeout(Math.max(0, t - (Date.now() - start)));
			// Light snapshot of the visible first-viewport text at the reference frame; the final measurement is diffed against it.
			if (t === LATE_REFERENCE_MS) earlySnapshot = await evaluateAtViewport(page, snapshotSource).catch(() => null);
			const file = `${name}-t${t}.png`;
			await shot(page, file);
			result.frames.push({ file, targetMs: t, atMs: Date.now() - start });
		}
		await page.waitForLoadState('load', { timeout: 60000 });
		const loadMs = loadEventMs ?? Date.now() - start;
		const settle = await waitForSettled(page);
		if (!settle.fontsReady || !settle.quiet) {
			notes.push(`${name}: page not settled (fonts ready: ${settle.fontsReady}, DOM quiet: ${settle.quiet}); measurements may miss late content.`);
		}
		result.timing = { domContentLoadedMs, loadMs, settledMs: Date.now() - start, fontsReady: settle.fontsReady, domQuiet: settle.quiet };

		// Scroll the whole page first so lazy content exists, then take the full-page shot from the top.
		const scrolled = await scrollWholePage(page);
		if (scrolled.capped) {
			notes.push(`${name}: scrolled ${scrolled.steps} steps and stopped before the bottom; the page is longer or keeps growing. Lazy content below may be missing.`);
		}
		result.fullPage = `${name}-full.png`;
		await shot(page, result.fullPage, { fullPage: true });

		// Scroll series: shows sticky and scroll-driven animation that the full-page screenshot hides.
		const height = await page.evaluate(() => document.documentElement.scrollHeight);
		result.scrollHeight = height;
		const viewportHeight = contextOptions.viewport.height;
		const positions = scrollSeriesPositions(height, viewportHeight);
		for (const [i, y] of positions.entries()) {
			await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
			await page.waitForTimeout(1200);
			const file = `${name}-scroll-${String(i + 1).padStart(2, '0')}-${y}.png`;
			await shot(page, file);
			result.scrollShots.push({ file, y });
		}
		// Instant, because `scroll-behavior: smooth` would leave the page mid-scroll during measurement.
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		await page.waitForTimeout(500);

		if (name === 'desktop') {
			const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
			result.axe = axe.violations.map((v) => ({
				id: v.id,
				impact: v.impact,
				nodes: v.nodes.length,
				help: v.help,
				examples: v.nodes.slice(0, 3).map((n) => n.target.join(' '))
			}));
			result.axeIncomplete = axe.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help }));
		}
		result.measure = await measure(page);
		// Design measurements and the first-viewport pixels run at scroll position 0, before the focus walk moves the page.
		try {
			const { design, tells } = finishDesign(await runDesignScripts(page), { earlySnapshot });
			result.design = design;
			result.measure.tells = { ...result.measure.tells, ...tells };
		} catch (error) {
			notes.push(`${name}: design measurements failed: ${error.message.split('\n')[0]}`);
		}
		try {
			const viewportFile = `${name}-viewport.png`;
			await shot(page, viewportFile);
			result.pixels = await pixelReport(out, viewportFile);
		} catch (error) {
			notes.push(`${name}: pixel measures failed: ${error.message.split('\n')[0]}`);
		}
		result.focus = await focusWalk(page);
	} catch (error) {
		notes.push(`${name}: audit failed: ${error.message.split('\n')[0]}`);
	} finally {
		await context.close();
	}
	return result;
}

const notes = [];
const result = { url, notes, desktop: null, mobile: null };
// SwiftShader so WebGL animation renders headless.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
	const mobileDevice = devices[MOBILE_DEVICE];
	if (!mobileDevice) throw new Error(`Playwright has no device descriptor "${MOBILE_DEVICE}".`);
	const { defaultBrowserType: _ignored, ...mobileOptions } = mobileDevice;
	result.desktop = await auditViewport(browser, 'desktop', { viewport: { width: 1440, height: 900 } }, notes);
	result.mobile = await auditViewport(browser, 'mobile', mobileOptions, notes);
} finally {
	await browser.close();
	writeFileSync(join(out, 'audit.json'), JSON.stringify(result, null, 1));
}

console.log(JSON.stringify(result, null, 1));
if (!result.desktop?.measure) {
	console.error('Desktop audit did not complete. See "notes" in audit.json.');
	process.exitCode = 1;
}
