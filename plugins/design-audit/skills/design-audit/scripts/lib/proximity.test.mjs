import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ratio, deriveProximity } from './proximity.mjs';

const box = { x: 0, y: 0, w: 10, h: 10 };

test('ratio divides, rounds to two digits and returns null without a usable divisor', () => {
	assert.equal(ratio(48, 32), 1.5);
	assert.equal(ratio(10, 3), 3.33);
	assert.equal(ratio(10, 0), null);
	assert.equal(ratio(null, 4), null);
	assert.equal(ratio(4, null), null);
});

test('headings: flagged when the gap below is equal to or larger than the gap above', () => {
	const p = deriveProximity({
		headings: [
			{ selector: 'h2', box, tag: 'H2', text: 'A', gapAbove: 8, gapBelow: 32 },
			{ selector: 'h2:nth-of-type(2)', box, tag: 'H2', text: 'B', gapAbove: 24, gapBelow: 24 },
			{ selector: 'h2:nth-of-type(3)', box, tag: 'H2', text: 'C', gapAbove: 64, gapBelow: 24 },
			{ selector: 'h1', box, tag: 'H1', text: 'D', gapAbove: null, gapBelow: 24 }
		],
		labels: [],
		groups: []
	});
	assert.deepEqual(p.headings.violations.map((h) => h.text), ['A', 'B']);
	assert.equal(p.headings.items[2].ratio, 2.67, 'above / below');
	assert.equal(p.headings.items[3].ratio, null);
	assert.equal(p.headings.items[3].closerToPrevious, false);
});

test('labels: flagged when another control is as near as, or nearer than, the own control', () => {
	const p = deriveProximity({
		headings: [],
		labels: [
			{ selector: 'label', box, text: 'ok', ownGap: 8, otherGap: 24 },
			{ selector: 'label:nth-of-type(2)', box, text: 'wrong', ownGap: 24, otherGap: 4 },
			{ selector: 'label:nth-of-type(3)', box, text: 'wrapped', ownGap: 0, otherGap: 10 },
			{ selector: 'label:nth-of-type(4)', box, text: 'alone', ownGap: 8, otherGap: null }
		],
		groups: []
	});
	assert.deepEqual(p.labels.violations.map((l) => l.text), ['wrong']);
	assert.equal(p.labels.items[0].ratio, 3);
});

test('groups: flagged only when inner gap is equal to or larger than outer gap; the ratio is reported, not thresholded', () => {
	const p = deriveProximity({
		headings: [],
		labels: [],
		groups: [
			{ selector: 'ul', box, signature: 'div.card', count: 3, inner: 16, outer: 24 },
			{ selector: 'ul:nth-of-type(2)', box, signature: 'div.item', count: 3, inner: 40, outer: 16 },
			{ selector: 'ul:nth-of-type(3)', box, signature: 'div.x', count: 3, inner: 20, outer: 21 },
			{ selector: 'ul:nth-of-type(4)', box, signature: 'div.y', count: 3, inner: 20, outer: null }
		]
	});
	assert.deepEqual(p.groups.violations.map((g) => g.selector), ['ul:nth-of-type(2)']);
	assert.deepEqual(p.groups.items.map((g) => g.ratio), [1.5, 0.4, 1.05, null]);
	assert.equal(p.violations.length, 1);
	assert.equal(p.violations[0].kind, 'group');
});

test('violations merge all kinds with a kind tag', () => {
	const p = deriveProximity({
		headings: [{ selector: 'h2', box, tag: 'H2', text: 'A', gapAbove: 8, gapBelow: 32 }],
		labels: [{ selector: 'label', box, text: 'x', ownGap: 24, otherGap: 4 }],
		groups: []
	});
	assert.deepEqual(p.violations.map((v) => v.kind), ['heading', 'label']);
});
