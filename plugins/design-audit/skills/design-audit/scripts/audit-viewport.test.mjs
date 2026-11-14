// auditViewport against a local fixture with injected screenshot failures.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closeBrowser, fixtureUrl } from './browser-helpers.mjs';
import { auditViewport } from './audit-viewport.mjs';

let browser = null;
const skip = await chromium
	.launch()
	.then((b) => {
		browser = b;
		return false;
	})
	.catch(() => 'Chromium is not installed. Run: pnpm exec playwright install chromium');
after(async () => {
	await browser?.close();
	await closeBrowser();
});

/** Screenshot stand-in that throws for the listed files, a given number of times each (Infinity = always). */
function flaky(failures) {
	const seen = {};
	return async (page, path, options) => {
		const file = path.split('/').pop();
		seen[file] = (seen[file] || 0) + 1;
		if (file in failures && seen[file] <= failures[file]) throw new Error('Protocol error (Page.captureScreenshot): Unable to capture screenshot');
		return page.screenshot({ path, scale: 'css', ...options });
	};
}

async function run(failures) {
	const out = mkdtempSync(join(tmpdir(), 'design-audit-vp-'));
	const notes = [];
	try {
		const result = await auditViewport(browser, 'desktop', { viewport: { width: 1280, height: 800 } }, notes, {
			url: fixtureUrl('site.html'),
			out,
			screenshot: flaky(failures),
			retryDelayMs: 0
		});
		return { result, notes };
	} finally {
		rmSync(out, { recursive: true, force: true });
	}
}

test('a full-page capture that fails once is retried and leaves no note', { skip, timeout: 120000 }, async () => {
	const { result, notes } = await run({ 'desktop-full.png': 1 });
	assert.equal(result.fullPage, 'desktop-full.png');
	assert.deepEqual(result.missing, []);
	assert.deepEqual(notes, []);
	assert.ok(result.measure && result.design && result.pixels && result.focus);
});

test('a full-page capture that fails twice keeps every measurement, notes the failure and names no file', { skip, timeout: 120000 }, async () => {
	const { result, notes } = await run({ 'desktop-full.png': Infinity });
	assert.equal(result.fullPage, null, 'no name for a file that does not exist');
	assert.deepEqual(result.missing, ['fullPage']);
	assert.ok(notes.some((n) => /desktop: full-page screenshot failed/.test(n)), notes.join('\n'));
	assert.ok(result.measure && result.design && result.pixels && result.focus, 'measurements survive');
	assert.ok(result.scrollShots.length >= 0 && result.frames.length === 3);
});

test('a failed load frame and a failed viewport shot are recorded, the rest stays', { skip, timeout: 120000 }, async () => {
	const { result, notes } = await run({ 'desktop-t1000.png': Infinity, 'desktop-viewport.png': Infinity });
	assert.deepEqual(result.frames.map((f) => f.targetMs), [300, 2500]);
	assert.equal(result.pixels, null);
	assert.ok(result.measure && result.design && result.focus);
	assert.deepEqual(result.missing.sort(), ['frame t1000', 'pixels']);
	assert.equal(notes.length, 2);
});
