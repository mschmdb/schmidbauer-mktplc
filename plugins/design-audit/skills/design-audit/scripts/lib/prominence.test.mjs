import { test } from 'node:test';
import assert from 'node:assert/strict';
import { positionPrior, typeFactor, contrastFactor, scoreCandidate, rankProminence, METHOD, TOP_PROMINENT } from './prominence.mjs';

const box = { x: 0, y: 0, w: 10, h: 10 };
const view = { width: 1000, height: 600 };
const text = (over = {}) => ({
	selector: 'p',
	box,
	label: 'x',
	kind: 'text',
	area: 60000,
	color: 'rgb(0, 0, 0)',
	background: 'rgb(255, 255, 255)',
	surround: 'rgb(255, 255, 255)',
	fontSize: 16,
	fontWeight: '400',
	cx: 100,
	cy: 100,
	...over
});

test('positionPrior favours the top left and stays within 0.4 and 1', () => {
	assert.equal(positionPrior(0, 0, 1000, 600), 1);
	assert.equal(positionPrior(1000, 600, 1000, 600), 0.4);
	assert.ok(positionPrior(100, 100, 1000, 600) > positionPrior(900, 500, 1000, 600));
	assert.equal(positionPrior(5000, 5000, 1000, 600), 0.4, 'clamped');
});

test('typeFactor multiplies size over 16 px and weight over 400', () => {
	assert.equal(typeFactor(16, '400'), 1);
	assert.equal(typeFactor(32, '400'), 2);
	assert.equal(typeFactor(16, '700'), 1.75);
	assert.equal(typeFactor(16, 'bold'), 1.75);
	assert.equal(typeFactor(16, 'normal'), 1);
});

test('contrastFactor is (ratio - 1) / 20 with a floor, and 0.5 for media', () => {
	assert.equal(contrastFactor(text()), 1);
	assert.ok(contrastFactor(text({ color: 'rgb(238, 238, 238)' })) < 0.05);
	assert.equal(contrastFactor({ kind: 'media' }), 0.5);
	const filled = contrastFactor(text({ color: 'rgb(255, 255, 255)', background: 'rgb(0, 0, 0)', surround: 'rgb(255, 255, 255)' }));
	assert.equal(filled, 1, 'white on a black fill');
});

test('contrastFactor takes the stronger of text-on-fill and fill-on-surround', () => {
	const c = contrastFactor(text({ color: 'rgb(250, 250, 250)', background: 'rgb(0, 0, 0)', surround: 'rgb(255, 255, 255)' }));
	assert.ok(c > 0.9);
	const weakText = contrastFactor(text({ color: 'rgb(60, 60, 60)', background: 'rgb(0, 0, 0)', surround: 'rgb(255, 255, 255)' }));
	assert.equal(weakText, 1, 'the dark fill on white still stands out');
});

test('scoreCandidate multiplies area share, contrast, type and position', () => {
	const s = scoreCandidate(text({ area: 30000, cx: 0, cy: 0 }), view);
	assert.equal(s, 0.05 * 1 * 1 * 1);
});

test('rankProminence returns the top 8 with rank, relative score and the method', () => {
	const candidates = Array.from({ length: 12 }, (_, i) => text({ selector: `p${i}`, label: `L${i}`, fontSize: 16 + i }));
	const r = rankProminence(candidates, view);
	assert.equal(TOP_PROMINENT, 8);
	assert.equal(r.items.length, 8);
	assert.equal(r.items[0].selector, 'p11');
	assert.equal(r.items[0].rank, 1);
	assert.equal(r.items[0].relative, 1);
	assert.ok(r.items[1].relative < 1);
	assert.equal(r.method, METHOD);
	assert.match(r.method, /prediction/);
	assert.ok(r.items[0].box && r.items[0].selector && r.items[0].label !== undefined);
});

test('rankProminence handles no candidates', () => {
	assert.deepEqual(rankProminence([], view).items, []);
});
