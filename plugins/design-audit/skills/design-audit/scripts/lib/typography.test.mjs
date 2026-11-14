import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFamily, isIconFont, deriveTypography, neighbourRatios } from './typography.mjs';

test('normalizeFamily strips quotes, framework hashes, fallback and variable suffixes', () => {
	assert.equal(normalizeFamily('"Inter"'), 'Inter');
	assert.equal(normalizeFamily("'Open Sans'"), 'Open Sans');
	assert.equal(normalizeFamily('__Inter_a1b2c3'), 'Inter');
	assert.equal(normalizeFamily('__Inter_Fallback_a1b2c3'), 'Inter');
	assert.equal(normalizeFamily('__Playfair_Display_9f8e7d6c'), 'Playfair Display');
	assert.equal(normalizeFamily('Inter Variable'), 'Inter');
	assert.equal(normalizeFamily('  Georgia '), 'Georgia');
});

test('isIconFont recognises common icon font names only', () => {
	for (const name of ['Font Awesome 6 Free', 'Material Icons', 'Material Symbols Outlined', 'bootstrap-icons', 'remixicon', 'Ionicons']) {
		assert.equal(isIconFont(name), true, name);
	}
	for (const name of ['Inter', 'Georgia', 'Iconic Sans Text']) assert.equal(isIconFont(name), false, name);
});

test('neighbourRatios gives the ratio between neighbouring sizes, ascending', () => {
	assert.deepEqual(neighbourRatios([24, 16, 32]), [
		{ from: 16, to: 24, ratio: 1.5 },
		{ from: 24, to: 32, ratio: 1.333 }
	]);
	assert.deepEqual(neighbourRatios([16]), []);
});

const raw = {
	families: {
		'"Inter"': { text: 600, code: 0 },
		__Inter_abc123: { text: 200, code: 0 },
		Georgia: { text: 200, code: 0 },
		'"Font Awesome 6 Free"': { text: 5, code: 0 },
		'"JetBrains Mono"': { text: 0, code: 80 }
	},
	weights: { 400: 700, 700: 200, 300: 100 },
	sizes: { '16px': 800, '32px': 100, '48px': 100 },
	mainSizes: { '16px': 700, '48px': 20 },
	h1: { selector: 'h1', box: { x: 0, y: 0, w: 1, h: 1 }, fontSize: '48px', words: 5 },
	bodyLineHeights: [
		{ selector: 'p', box: { x: 0, y: 0, w: 1, h: 1 }, fontSize: 16, lineHeightPx: 24 },
		{ selector: 'p:nth-of-type(2)', box: { x: 0, y: 0, w: 1, h: 1 }, fontSize: 16, lineHeightPx: 28.8 },
		{ selector: 'p:nth-of-type(3)', box: { x: 0, y: 0, w: 1, h: 1 }, fontSize: 16, lineHeightPx: null }
	],
	headingLineHeights: [{ selector: 'h2', box: { x: 0, y: 0, w: 1, h: 1 }, tag: 'H2', fontSize: 32, lineHeightPx: 38.4 }],
	uppercase: [{ selector: 'span', box: { x: 0, y: 0, w: 1, h: 1 }, text: 'NEW', fontSize: 12, letterSpacingPx: 1.2 }],
	justified: [{ selector: 'p', box: { x: 0, y: 0, w: 1, h: 1 }, hyphens: 'manual', lines: 6 }],
	centered: [
		{ selector: 'p', box: { x: 0, y: 0, w: 1, h: 1 }, lines: 3 },
		{ selector: 'p:nth-of-type(2)', box: { x: 0, y: 0, w: 1, h: 1 }, lines: 5 }
	]
};

test('deriveTypography merges families, drops icon and code-only fonts, and weights by text length', () => {
	const t = deriveTypography(raw);
	assert.deepEqual(t.families.map((f) => [f.family, f.chars]), [['Inter', 800], ['Georgia', 200]]);
	assert.equal(t.families[0].share, 0.8);
	assert.deepEqual(t.weights.map((w) => w.weight), [400, 700, 300]);
	assert.equal(t.lightWeightShare, 0.1);
});

test('deriveTypography reports sizes, ratios, body size and h1 ratio', () => {
	const t = deriveTypography(raw);
	assert.deepEqual(t.sizes.map((s) => s.px), [16, 32, 48]);
	assert.deepEqual(t.sizeRatios.map((r) => r.ratio), [2, 1.5]);
	assert.equal(t.bodySize, 16);
	assert.equal(t.h1.fontSize, 48);
	assert.equal(t.h1.ratioToBody, 3);
});

test('deriveTypography computes line-height ratios and counts normal separately', () => {
	const t = deriveTypography(raw);
	assert.deepEqual(t.lineHeight.body.samples.map((s) => s.ratio), [1.5, 1.8, null]);
	assert.equal(t.lineHeight.body.median, 1.65);
	assert.equal(t.lineHeight.body.normalCount, 1);
	assert.equal(t.lineHeight.headings.median, 1.2);
});

test('deriveTypography expresses uppercase tracking in em and keeps only centred text over three lines', () => {
	const t = deriveTypography(raw);
	assert.equal(t.uppercase[0].letterSpacingEm, 0.1);
	assert.equal(t.justified[0].hyphens, 'manual');
	assert.deepEqual(t.centered.map((c) => c.lines), [5]);
});

test('deriveTypography copes with an empty page', () => {
	const t = deriveTypography({ families: {}, weights: {}, sizes: {}, mainSizes: {}, h1: null, bodyLineHeights: [], headingLineHeights: [], uppercase: [], justified: [], centered: [] });
	assert.equal(t.bodySize, null);
	assert.equal(t.h1, null);
	assert.equal(t.lineHeight.body.median, null);
	assert.deepEqual(t.families, []);
});
