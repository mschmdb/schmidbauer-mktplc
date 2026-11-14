// Audit one viewport (desktop or mobile) of one URL. Used by audit.mjs.
// Every capture and measurement runs in its own step: one failure is noted and listed in `missing`,
// and the other data stays.
import { AxeBuilder } from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { focusWalk } from './focus-walk.mjs';
import { scrollSeriesPositions } from './lib/scroll.mjs';
import { finishMeasure } from './lib/post.mjs';
import { finishDesign } from './lib/design.mjs';
import { withRetry } from './lib/retry.mjs';
import { runDesignScripts } from './design-scripts.mjs';
import { pixelReport } from './pixels.mjs';
import { boxesForNodes } from './page-boxes.mjs';
import { scrollWholePage, waitForSettled } from './page-prep.mjs';
import { evaluateAtViewport } from './lib/viewport.mjs';
import { LATE_REFERENCE_MS } from './lib/late-content.mjs';

const FRAME_TIMES_MS = [300, 1000, 2500];
export const MOBILE_DEVICE = 'iPhone 13';

const here = dirname(fileURLToPath(import.meta.url));
const measureSource = readFileSync(join(here, 'measure.js'), 'utf8');
const snapshotSource = readFileSync(join(here, 'snapshot-first-viewport.js'), 'utf8');
const measure = async (page) => finishMeasure(await evaluateAtViewport(page, measureSource));

// Screenshots use CSS pixels: a 3x device would otherwise exceed Chromium's image size limit on long pages.
const defaultScreenshot = (page, path, options = {}) => page.screenshot({ path, scale: 'css', ...options });
const firstLine = (error) => String(error.message).split('\n')[0];

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
		axeIncomplete: null,
		missing: []
	};
}

/**
 * @param {import('playwright').Browser} browser
 * @param {'desktop' | 'mobile'} name
 * @param {import('playwright').BrowserContextOptions} contextOptions
 * @param {string[]} notes shared note list; this function appends
 * @param {{ url: string, out: string, screenshot?: Function, retryDelayMs?: number }} options `screenshot(page, path, options)` replaces page.screenshot (tests inject failures)
 */
export async function auditViewport(browser, name, contextOptions, notes, { url, out, screenshot = defaultScreenshot, retryDelayMs }) {
	const result = emptyViewport(name, contextOptions);
	const retry = retryDelayMs === undefined ? {} : { delayMs: retryDelayMs };
	/** Capture with one retry. Returns true on success; a failure is noted and listed in `missing`. */
	const capture = async (page, file, label, options = {}) => {
		try {
			await withRetry(() => screenshot(page, join(out, file), options), retry);
			return true;
		} catch (error) {
			notes.push(`${name}: ${label} screenshot failed after a retry: ${firstLine(error)}`);
			result.missing.push(label === 'full-page' ? 'fullPage' : label === 'viewport' ? 'pixels' : label);
			return false;
		}
	};
	/** Run one measurement step; a failure is noted and listed in `missing`, the value is null. */
	const step = async (key, label, fn) => {
		try {
			return await fn();
		} catch (error) {
			notes.push(`${name}: ${label} failed: ${firstLine(error)}`);
			result.missing.push(key);
			return null;
		}
	};
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
			const atMs = Date.now() - start;
			if (await capture(page, file, `frame t${t}`)) result.frames.push({ file, targetMs: t, atMs });
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
		const fullFile = `${name}-full.png`;
		if (await capture(page, fullFile, 'full-page', { fullPage: true })) result.fullPage = fullFile;

		// Scroll series: shows sticky and scroll-driven animation that the full-page screenshot hides.
		const height = await page.evaluate(() => document.documentElement.scrollHeight);
		result.scrollHeight = height;
		const viewportHeight = contextOptions.viewport.height;
		const positions = scrollSeriesPositions(height, viewportHeight);
		for (const [i, y] of positions.entries()) {
			await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
			await page.waitForTimeout(1200);
			const file = `${name}-scroll-${String(i + 1).padStart(2, '0')}-${y}.png`;
			if (await capture(page, file, `scroll shot ${y}`)) result.scrollShots.push({ file, y });
		}
		// Instant, because `scroll-behavior: smooth` would leave the page mid-scroll during measurement.
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		await page.waitForTimeout(500);

		if (name === 'desktop') {
			const axe = await step('axe', 'axe-core run', () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze());
			if (axe) {
				const MAX_EXAMPLES = 3;
				const summarise = async (list) =>
					Promise.all(
						list.map(async (v) => ({
							id: v.id,
							...(v.impact ? { impact: v.impact } : {}),
							nodes: v.nodes.length,
							help: v.help,
							examples: await boxesForNodes(page, v.nodes.slice(0, MAX_EXAMPLES)).catch(() => v.nodes.slice(0, MAX_EXAMPLES).map((n) => ({ selector: n.target.join(' '), box: null })))
						}))
					);
				result.axe = await summarise(axe.violations);
				result.axeIncomplete = await summarise(axe.incomplete);
			}
		}
		result.measure = await step('measure', 'page measurement', () => measure(page));
		// Design measurements and the first-viewport pixels run at scroll position 0, before the focus walk moves the page.
		const designed = await step('design', 'design measurements', async () => finishDesign(await runDesignScripts(page), { earlySnapshot }));
		if (designed) {
			result.design = designed.design;
			if (result.measure) result.measure.tells = { ...result.measure.tells, ...designed.tells };
		}
		const viewportFile = `${name}-viewport.png`;
		if (await capture(page, viewportFile, 'viewport')) {
			result.pixels = await step('pixels', 'pixel measures', () => pixelReport(out, viewportFile));
		}
		result.focus = await step('focus', 'focus walk', () => focusWalk(page));
	} catch (error) {
		notes.push(`${name}: audit failed: ${firstLine(error)}`);
		for (const key of ['measure', 'design', 'pixels', 'focus']) if (!result[key] && !result.missing.includes(key)) result.missing.push(key);
	} finally {
		await context.close();
	}
	return result;
}
