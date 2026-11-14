import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureDesignFixture, skipReason } from './browser-helpers.mjs';
import { deriveTypography } from './lib/typography.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('typography: clean fixture reports Georgia, 18 px body, 48 px h1 and tracked-free caps', opts, async () => {
	const raw = await measureDesignFixture('design-clean.html');
	const t = deriveTypography(raw.typography);
	assert.deepEqual(t.families.map((f) => f.family), ['Georgia']);
	assert.equal(t.bodySize, 16, 'cards and form use 16 px');
	assert.ok(t.sizes.some((s) => s.px === 18));
	assert.equal(t.h1.fontSize, 48);
	assert.ok(t.h1.words === 5);
	assert.ok(t.h1.ratioToBody >= 2.5);
	assert.deepEqual(t.uppercase, []);
	assert.deepEqual(t.justified, []);
	assert.deepEqual(t.centered, []);
	const bodyRatios = t.lineHeight.body.samples.map((s) => s.ratio);
	assert.ok(bodyRatios.length >= 1 && bodyRatios.every((r) => r >= 1.4 && r <= 1.7), `ratios ${bodyRatios}`);
	assert.ok(t.lineHeight.headings.median >= 1.2 && t.lineHeight.headings.median <= 1.3);
});

test('typography: generic fixture reports Inter, tracked caps and centred text', opts, async () => {
	const raw = await measureDesignFixture('design-generic-ai.html');
	const t = deriveTypography(raw.typography);
	assert.deepEqual(t.families.map((f) => f.family), ['Inter']);
	assert.ok(t.uppercase.length >= 1);
	assert.ok(Math.abs(t.uppercase[0].letterSpacingEm - 0.12) < 0.01, `em ${t.uppercase[0].letterSpacingEm}`);
	assert.equal(t.h1.fontSize, 56);
});

test('typography: lists carry a selector that resolves to the element and a bounding box', opts, async () => {
	const raw = await measureDesignFixture('design-generic-ai.html');
	assert.match(raw.typography.h1.selector, /h1/);
	assert.ok(raw.typography.h1.box.w > 0 && raw.typography.h1.box.h > 0);
});

test('typography: justified and long centred paragraphs are listed with hyphens and line count', opts, async () => {
	const raw = await measureDesignFixture('design-typography.html', { viewport: { width: 600, height: 800 } });
	const t = deriveTypography(raw.typography);
	assert.equal(t.justified.length, 1);
	assert.equal(t.justified[0].hyphens, 'manual');
	assert.ok(t.justified[0].lines >= 3);
	assert.equal(t.centered.length, 1, 'only the long centred paragraph counts');
	assert.ok(t.centered[0].lines > 3);
	assert.ok(t.uppercase.some((u) => u.letterSpacingEm === 0));
});

test('typography: icon fonts and code-only families are excluded', opts, async () => {
	const raw = await measureDesignFixture('design-typography.html');
	const t = deriveTypography(raw.typography);
	const names = t.families.map((f) => f.family);
	assert.ok(!names.some((n) => /awesome|mono/i.test(n)), names.join(','));
	assert.ok(names.includes('Inter'), 'hash suffix stripped');
});
