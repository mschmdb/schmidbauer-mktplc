// Run with: node --test extract-tokens.test.mjs
// Playwright resolves from ../../design-audit/scripts/node_modules (see extract-tokens.mjs).
// The test skips when Playwright or Chromium is missing.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadPlaywright, extractFromUrl, topValues } from './extract-tokens.mjs';

const fixture = readFileSync(fileURLToPath(new URL('./fixtures/tokens.html', import.meta.url)), 'utf8');
const playwright = await loadPlaywright();

let server;
let url;
let skipReason = playwright ? false : 'Playwright not installed in skills/design-audit/scripts';
let result;

before(async () => {
	if (skipReason) return;
	server = createServer((req, res) => {
		res.setHeader('content-type', 'text/html; charset=utf-8');
		res.end(fixture);
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	url = `http://127.0.0.1:${server.address().port}/`;
	try {
		result = await extractFromUrl(url, playwright);
	} catch (error) {
		skipReason = `Chromium unavailable: ${String(error.message).split('\n')[0]}`;
	}
});

after(async () => {
	if (server) await new Promise((resolve) => server.close(resolve));
});

const opts = () => ({ skip: skipReason });

test('topValues sorts by count and keeps ties stable', () => {
	const map = new Map([['b', 1], ['a', 3], ['c', 3]]);
	assert.deepEqual(topValues(map), [
		{ value: 'a', count: 3 },
		{ value: 'c', count: 3 },
		{ value: 'b', count: 1 }
	]);
});

test('reports desktop and mobile viewports', async (t) => {
	if (skipReason) return t.skip(skipReason);
	assert.deepEqual(Object.keys(result.viewports), ['desktop', 'mobile']);
	assert.equal(result.viewports.desktop.viewport.width, 1440);
	assert.ok(result.viewports.mobile.viewport.width < 600);
});

test('reads :root custom properties and their value per viewport', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const desktop = Object.fromEntries(result.viewports.desktop.customProperties.map((p) => [p.name, p.value]));
	const mobile = Object.fromEntries(result.viewports.mobile.customProperties.map((p) => [p.name, p.value]));
	assert.equal(desktop['--accent'], '#3a6744');
	assert.equal(desktop['--text-4xl'], '3rem');
	assert.equal(mobile['--text-4xl'], '2rem');
});

test('ignores custom properties that are not on :root', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const names = result.viewports.desktop.customProperties.map((p) => p.name);
	assert.equal(names.filter((n) => n === '--bg').length, 1);
});

test('counts font families, sizes, weights and line heights of visible text', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const d = result.viewports.desktop;
	const families = d.fontFamilies.map((f) => f.value);
	assert.ok(families.includes('Helvetica'));
	assert.ok(families.includes('Georgia'));
	assert.ok(!families.includes('Courier'), 'display:none text must not count');
	assert.ok(d.fontSizes.some((s) => s.value === '48px'));
	assert.ok(d.fontWeights.some((w) => w.value === '700'));
	assert.ok(d.lineHeights.some((l) => l.value === '52.8px'));
});

test('collects colours, spacing, radii and shadows with counts', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const d = result.viewports.desktop;
	assert.ok(d.textColors.some((c) => c.value === 'rgb(20, 20, 20)'));
	assert.ok(d.backgroundColors.some((c) => c.value === 'rgb(255, 255, 255)' && c.count === 2));
	assert.ok(d.spacing.some((s) => s.value === '16px'));
	assert.deepEqual(d.radii.map((r) => r.value).sort(), ['4px', '8px']);
	assert.equal(d.shadows.length, 1);
	assert.equal(d.shadows[0].count, 2);
});

test('mobile uses the smaller heading size', async (t) => {
	if (skipReason) return t.skip(skipReason);
	assert.ok(result.viewports.mobile.fontSizes.some((s) => s.value === '32px'));
});

test('drops Tailwind built-in variables from the observed custom properties', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const names = result.viewports.desktop.customProperties.map((p) => p.name);
	for (const dropped of ['--tw-ring-offset-width', '--default-transition-duration', '--font-weight-semibold', '--text-xs--line-height', '--text-sm', '--color-red-500']) {
		assert.ok(!names.includes(dropped), `${dropped} must be dropped`);
	}
	assert.ok(result.viewports.desktop.tailwindDefaultsOmitted.includes('--text-sm'));
});

test('keeps project tokens: own names in the theme layer and defaults declared outside it', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const names = result.viewports.desktop.customProperties.map((p) => p.name);
	assert.ok(names.includes('--color-ink'));
	assert.ok(names.includes('--text-4xl'));
});

test('reports variables used with var() but defined nowhere', async (t) => {
	if (skipReason) return t.skip(skipReason);
	const undef = result.viewports.desktop.undefinedProperties;
	assert.deepEqual(undef, [{ name: '--container-wide', hasFallback: true }]);
});
