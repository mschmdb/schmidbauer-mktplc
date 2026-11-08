#!/usr/bin/env node
// Audit one URL: axe-core, page measurements, AI-look signals, text repetition,
// desktop and mobile screenshots, a scroll series and load-animation frames.
// Usage: node audit.mjs <url> <output-dir>
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
	console.error('Usage: node audit.mjs <url> <output-dir>');
	process.exit(2);
}
mkdirSync(out, { recursive: true });

const here = dirname(fileURLToPath(import.meta.url));
const measureSource = readFileSync(join(here, 'measure.js'), 'utf8');
const measure = (page) => page.evaluate(measureSource);

async function focusWalk(page, steps = 10) {
	const seen = [];
	for (let i = 0; i < steps; i++) {
		await page.keyboard.press('Tab');
		seen.push(
			await page.evaluate(() => {
				const e = document.activeElement;
				const s = getComputedStyle(e);
				const label = (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 25);
				return `${e.tagName} "${label}" outline=${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} shadow=${s.boxShadow !== 'none'}`;
			})
		);
	}
	return seen;
}

async function auditViewport(browser, name, viewport, result) {
	const context = await browser.newContext({ viewport });
	try {
		const page = await context.newPage();

		// Animation frames from first paint, before networkidle.
		const start = Date.now();
		const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
		result[`${name}Status`] = response?.status() ?? null;
		for (const t of [300, 1000, 2500]) {
			await page.waitForTimeout(Math.max(0, t - (Date.now() - start)));
			await page.screenshot({ path: join(out, `${name}-t${t}.png`) });
		}
		await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
			result.notes.push(`${name}: networkidle not reached within 60 s; measurements may miss late content.`);
		});
		result[`${name}LoadMs`] = Date.now() - start;

		await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });

		// Scroll series: shows sticky and scroll-driven animation that the full-page screenshot hides.
		const height = await page.evaluate(() => document.documentElement.scrollHeight);
		const stepPx = Math.round(viewport.height * 0.5);
		const scrollShots = [];
		for (let y = stepPx, i = 1; y < Math.min(height, viewport.height * 4); y += stepPx, i++) {
			await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
			await page.waitForTimeout(1200);
			const file = `${name}-scroll-${String(i).padStart(2, '0')}-${y}.png`;
			await page.screenshot({ path: join(out, file) });
			scrollShots.push(file);
		}
		result[`${name}ScrollShots`] = scrollShots;
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
			result.measure = await measure(page);
			result.focus = await focusWalk(page);
		} else {
			result.mobileSmallTargets = (await measure(page)).smallTargets;
		}
	} finally {
		await context.close();
	}
}

const result = { url, notes: [] };
// SwiftShader so WebGL animation renders headless.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
	for (const [name, viewport] of [
		['desktop', { width: 1440, height: 900 }],
		['mobile', { width: 390, height: 844 }]
	]) {
		try {
			await auditViewport(browser, name, viewport, result);
		} catch (error) {
			result.notes.push(`${name}: audit failed: ${error.message.split('\n')[0]}`);
		}
	}
} finally {
	await browser.close();
	writeFileSync(join(out, 'audit.json'), JSON.stringify(result, null, 1));
}

console.log(JSON.stringify(result, null, 1));
if (!result.measure) {
	console.error('Desktop audit did not complete. See "notes" in audit.json.');
	process.exitCode = 1;
}
