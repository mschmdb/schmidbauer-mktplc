import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveHierarchy, deriveFirstViewport, NEAR_LARGEST } from './hierarchy.mjs';

const box = { x: 0, y: 0, w: 10, h: 10 };

test('deriveHierarchy counts filled primary-looking buttons and keeps their labels', () => {
	const h = deriveHierarchy({ primaryButtons: [{ selector: 'a', box, label: 'Start', background: 'rgb(0, 0, 255)', color: '#fff' }] });
	assert.equal(h.primaryButtons.count, 1);
	assert.equal(h.primaryButtons.items[0].label, 'Start');
	assert.equal(deriveHierarchy({ primaryButtons: [] }).primaryButtons.count, 0);
});

const baseRaw = {
	width: 1440,
	height: 900,
	h1: { present: true, anywhere: true, selector: 'h1', box, fontSize: '56px', words: 5 },
	weights: [
		{ selector: 'h1', box, label: 'Big', area: 40000, fontSize: 56, fontWeight: '700' },
		{ selector: 'h2', box, label: 'Almost', area: 45000, fontSize: 48, fontWeight: '700' },
		{ selector: 'p', box, label: 'Text', area: 20000, fontSize: 18, fontWeight: '400' }
	],
	media: { coveredShare: 0.25, items: [{ kind: 'img', selector: 'img', box }] },
	overlays: [{ selector: 'div', box, position: 'fixed', areaShare: 0.3 }],
	textOverImage: [{ selector: 'h1', box, label: 'Big', via: 'background-image' }]
};

test('deriveFirstViewport ranks visual weight and lists elements within 20 percent of the largest', () => {
	assert.equal(NEAR_LARGEST, 0.8);
	const f = deriveFirstViewport(baseRaw);
	assert.equal(f.weights.top[0].label, 'Big', '40000 x 56 beats 45000 x 48');
	assert.equal(f.weights.top[0].weight, 2240000);
	assert.deepEqual(f.weights.nearLargest.items.map((i) => i.label), ['Big', 'Almost']);
	assert.equal(f.weights.nearLargest.count, 2);
	assert.equal(f.weights.nearLargest.competing, true);
	assert.equal(f.weights.top[1].relative, 0.964);
});

test('deriveFirstViewport passes h1, media, overlays and text over images through with shares', () => {
	const f = deriveFirstViewport(baseRaw);
	assert.deepEqual(f.h1, { present: true, anywhere: true, selector: 'h1', box, fontSize: 56, words: 5 });
	assert.equal(f.media.coveredShare, 0.25);
	assert.equal(f.overlays[0].areaShare, 0.3);
	assert.equal(f.textOverImage.length, 1);
});

test('deriveFirstViewport handles a page without h1 and without text', () => {
	const f = deriveFirstViewport({ ...baseRaw, h1: { present: false, anywhere: false }, weights: [] });
	assert.equal(f.h1.present, false);
	assert.equal(f.h1.fontSize, null);
	assert.equal(f.weights.nearLargest.count, 0);
	assert.equal(f.weights.nearLargest.competing, false);
});
