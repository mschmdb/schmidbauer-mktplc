import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepFitShare, deriveSpacing, clusterEdges, deriveAlignment } from './spacing.mjs';

test('stepFitShare weights values by count and applies the tolerance', () => {
	const h = { 8: 6, 16: 2, 13: 2 };
	assert.equal(stepFitShare(h, 4, 0), 0.8);
	assert.equal(stepFitShare(h, 4, 1), 1, '13 is within 1 px of 12');
	assert.equal(stepFitShare(h, 5, 1), 0.2, 'only 16 is within 1 px of a multiple of 5');
});

test('stepFitShare handles an empty histogram', () => {
	assert.equal(stepFitShare({}, 4, 1), 0);
});

test('stepFitShare ignores zero values by construction and fits exact multiples', () => {
	assert.equal(stepFitShare({ 24: 1, 48: 1 }, 8, 0), 1);
	assert.equal(stepFitShare({ 10: 3, 15: 1 }, 5, 0), 1);
});

test('deriveSpacing summarises histogram, distinct values, fits, sections and side margins', () => {
	const sp = deriveSpacing({
		histogram: { 8: 4, 16: 4, 13: 2 },
		sections: [
			{ selector: 'section', box: { x: 0, y: 0, w: 1, h: 1 }, tag: 'SECTION', paddingTop: 64, paddingBottom: 64 },
			{ selector: 'section:nth-of-type(2)', box: { x: 0, y: 0, w: 1, h: 1 }, tag: 'SECTION', paddingTop: 96, paddingBottom: 64 }
		],
		sideMargins: [
			{ selector: 'p', box: { x: 0, y: 0, w: 1, h: 1 }, left: 8, right: 20 },
			{ selector: 'h1', box: { x: 0, y: 0, w: 1, h: 1 }, left: 16, right: 16 }
		]
	});
	assert.equal(sp.distinct, 3);
	assert.equal(sp.total, 10);
	assert.deepEqual(sp.histogram[0], { px: 8, count: 4 });
	assert.equal(sp.fit4, 1);
	assert.equal(sp.fit4Exact, 0.8);
	assert.equal(sp.sections.distinctPaddings, 2);
	assert.deepEqual(sp.sections.paddingRange, [64, 96]);
	assert.equal(sp.sideMargins.minLeft, 8);
	assert.equal(sp.sideMargins.minRight, 16);
	assert.equal(sp.sideMargins.narrow.length, 1, 'only the block with 8 px is under 16 px');
});

test('clusterEdges groups edges within the tolerance of the cluster start and ranks by count', () => {
	const items = [0, 1, 2, 3, 24, 24, 25, 100].map((x, i) => ({ x, selector: `p${i}`, box: { x, y: 0, w: 1, h: 1 } }));
	const clusters = clusterEdges(items, 2);
	assert.deepEqual(clusters.map((c) => [c.x, c.count]), [[1, 3], [24, 3], [3, 1], [100, 1]].sort((a, b) => b[1] - a[1] || a[0] - b[0]));
	assert.equal(clusters[0].samples.length, 3);
});

test('deriveAlignment reports the distinct count and the top 12', () => {
	const items = Array.from({ length: 20 }, (_, i) => ({ x: i * 10, selector: 'p', box: { x: i * 10, y: 0, w: 1, h: 1 } }));
	const a = deriveAlignment({ edges: items });
	assert.equal(a.distinct, 20);
	assert.equal(a.top.length, 12);
	assert.equal(a.tolerance, 2);
});
