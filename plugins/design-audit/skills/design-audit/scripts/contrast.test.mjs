import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, composite, contrastRatio, verdict, pairRatio } from './contrast.mjs';

test('parses hex in 3, 4, 6 and 8 digit forms', () => {
	assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
	assert.deepEqual(parseColor('#000c'), { r: 0, g: 0, b: 0, a: 0xcc / 255 });
	assert.deepEqual(parseColor('#141414'), { r: 20, g: 20, b: 20, a: 1 });
	assert.deepEqual(parseColor('#ff000080'), { r: 255, g: 0, b: 0, a: 128 / 255 });
});

test('parses rgb() and rgba() in comma and space syntax', () => {
	assert.deepEqual(parseColor('rgb(26, 21, 23)'), { r: 26, g: 21, b: 23, a: 1 });
	assert.deepEqual(parseColor('rgba(0, 0, 0, 0.5)'), { r: 0, g: 0, b: 0, a: 0.5 });
	assert.deepEqual(parseColor('rgb(0 0 0 / 50%)'), { r: 0, g: 0, b: 0, a: 0.5 });
});

test('parses white, black and transparent', () => {
	assert.deepEqual(parseColor('white'), { r: 255, g: 255, b: 255, a: 1 });
	assert.deepEqual(parseColor('transparent'), { r: 0, g: 0, b: 0, a: 0 });
});

test('rejects unsupported formats with a clear message', () => {
	assert.throws(() => parseColor('lab(50 20 30)'), /Unsupported color/);
	assert.throws(() => parseColor('rebeccapurple'), /Unsupported color/);
	assert.throws(() => parseColor('#12345'), /Unsupported color/);
});

test('composites a translucent color over an opaque one', () => {
	const out = composite({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 });
	assert.deepEqual(out, { r: 127.5, g: 127.5, b: 127.5, a: 1 });
});

test('fully transparent background takes the base color', () => {
	assert.equal(pairRatio('#000', 'rgba(0, 0, 0, 0)', '#fff').toFixed(2), '21.00');
});

test('translucent foreground lowers contrast', () => {
	const solid = pairRatio('#000', '#fff', '#fff');
	const faded = pairRatio('rgba(0, 0, 0, 0.5)', '#fff', '#fff');
	assert.ok(faded < solid);
	assert.equal(faded.toFixed(2), '3.98');
});

test('contrast ratio matches WCAG reference values', () => {
	assert.equal(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }).toFixed(2), '21.00');
	assert.equal(contrastRatio({ r: 118, g: 118, b: 118 }, { r: 255, g: 255, b: 255 }).toFixed(2), '4.54');
	assert.equal(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }).toFixed(2), '1.00');
});

test('verdict uses WCAG thresholds', () => {
	assert.equal(verdict(7.1), 'AAA text');
	assert.equal(verdict(4.5), 'AA text');
	assert.equal(verdict(3), 'large text / UI only');
	assert.equal(verdict(2.9), 'fails');
});

test('parses oklch() and oklab() into sRGB', () => {
	const round = (c) => [c.r, c.g, c.b].map(Math.round);
	assert.deepEqual(round(parseColor('oklch(1 0 0)')), [255, 255, 255]);
	assert.deepEqual(round(parseColor('oklch(0% 0 0)')), [0, 0, 0]);
	assert.deepEqual(round(parseColor('oklch(0.628 0.2577 29.23)')), [255, 0, 0]);
	assert.deepEqual(round(parseColor('oklab(0.452 -0.0325 -0.3115)')), [0, 0, 255]);
	assert.equal(parseColor('oklch(0.5 0.1 200 / 0.25)').a, 0.25);
});
