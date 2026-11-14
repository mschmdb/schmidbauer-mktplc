import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toOklch, hueBin, hueFamilies, lightnessSpread, deriveColour, CHROMA_THRESHOLD } from './colour.mjs';

const near = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);

test('toOklch matches known OKLCH values', () => {
	const red = toOklch('rgb(255, 0, 0)');
	near(red.L, 0.628, 0.002, 'red L');
	near(red.C, 0.2577, 0.002, 'red C');
	near(red.h, 29.23, 0.3, 'red h');
	const blue = toOklch('#0000ff');
	near(blue.L, 0.452, 0.002, 'blue L');
	near(blue.C, 0.313, 0.002, 'blue C');
	near(blue.h, 264.05, 0.3, 'blue h');
	const white = toOklch('white');
	near(white.L, 1, 0.001, 'white L');
	near(white.C, 0, 0.001, 'white C');
	const grey = toOklch('rgb(119, 119, 119)');
	near(grey.L, 0.57, 0.01, 'grey L');
	assert.ok(grey.C < 0.001);
});

test('toOklch accepts oklch(), color(srgb) and alpha, and returns null for unparsable input', () => {
	const c = toOklch('oklch(0.7 0.15 150 / 0.5)');
	near(c.L, 0.7, 0.01, 'L');
	near(c.C, 0.15, 0.01, 'C');
	near(c.h, 150, 1, 'h');
	assert.equal(c.alpha, 0.5);
	near(toOklch('color(srgb 1 0 0)').h, 29.23, 0.3, 'srgb red');
	assert.equal(toOklch('currentcolor'), null);
});

test('hueBin puts angles into 30 degree bins and wraps', () => {
	assert.equal(hueBin(0), 0);
	assert.equal(hueBin(29.9), 0);
	assert.equal(hueBin(30), 30);
	assert.equal(hueBin(264), 240);
	assert.equal(hueBin(359.9), 330);
	assert.equal(hueBin(-10), 330);
	assert.equal(hueBin(360), 0);
});

test('hueFamilies ignores colours at or below the chroma threshold and weights the rest', () => {
	assert.equal(CHROMA_THRESHOLD, 0.04);
	const f = hueFamilies({ 'rgb(255, 255, 255)': 500, 'rgb(0, 0, 255)': 30, 'rgb(0, 0, 200)': 10, 'rgb(255, 0, 0)': 10 });
	assert.equal(f.totalWeight, 550);
	assert.equal(f.neutralShare, 0.909);
	assert.deepEqual(f.families.map((x) => [x.hue, x.weight]), [[240, 40], [0, 10]]);
	assert.equal(f.families[0].share, 0.073);
	assert.equal(f.families[0].colours.length, 2);
});

test('hueFamilies composites translucent colours over white and skips unparsable ones', () => {
	const f = hueFamilies({ 'rgba(0, 0, 255, 0.02)': 100, 'bogus': 5 });
	assert.deepEqual(f.families, [], 'a 2 percent blue on white is nearly white');
	assert.equal(f.totalWeight, 100);
});

test('lightnessSpread reports min, max and spread, overall and for chromatic colours', () => {
	const s = lightnessSpread(['rgb(255, 255, 255)', 'rgb(0, 0, 0)', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)']);
	assert.equal(s.n, 4);
	near(s.spread, 1, 0.01, 'spread');
	assert.equal(s.chromatic.n, 2);
	near(s.chromatic.spread, 0.628 - 0.452, 0.005, 'chromatic spread');
	assert.deepEqual(lightnessSpread([]), { n: 0, min: null, max: null, spread: null, chromatic: { n: 0, min: null, max: null, spread: null } });
});

test('deriveColour builds hue families, accents on interactive elements and lightness spread per role', () => {
	const box = { x: 0, y: 0, w: 1, h: 1 };
	const c = deriveColour({
		text: { 'rgb(26, 26, 26)': 900, 'rgb(0, 0, 255)': 100 },
		backgrounds: { 'rgb(255, 255, 255)': 1000, 'rgb(0, 0, 255)': 50 },
		interactive: [
			{ kind: 'button', color: 'rgb(255, 255, 255)', background: 'rgb(0, 0, 255)', selector: 'a', box },
			{ kind: 'button', color: 'rgb(255, 255, 255)', background: 'rgb(0, 0, 255)', selector: 'a:nth-of-type(2)', box },
			{ kind: 'link', color: 'rgb(255, 0, 0)', background: 'rgba(0, 0, 0, 0)', selector: 'p > a', box },
			{ kind: 'link', color: 'rgb(26, 26, 26)', background: 'rgba(0, 0, 0, 0)', selector: 'nav > a', box }
		]
	});
	assert.equal(c.text.families[0].hue, 240);
	assert.equal(c.backgrounds.families[0].hue, 240);
	assert.equal(c.accents.length, 2);
	assert.deepEqual(c.accents.map((a) => [a.colour, a.count, a.kinds]), [['rgb(0, 0, 255)', 2, ['button']], ['rgb(255, 0, 0)', 1, ['link']]]);
	assert.equal(c.accents[0].hue, 240);
	assert.equal(c.accentHues.length, 2);
	assert.equal(c.lightness.buttonBackground.n, 1);
	assert.equal(c.lightness.linkText.n, 2);
	assert.equal(c.threshold.chroma, 0.04);
	assert.equal(c.threshold.hueBinDegrees, 30);
});
