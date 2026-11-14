import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveSimilarity, deriveRegion, topShare } from './similarity.mjs';

const sample = { selector: 'button', box: { x: 0, y: 0, w: 1, h: 1 } };
const sig = (over = {}) => ({ fontSize: '16px', fontWeight: '600', color: 'rgb(255, 255, 255)', background: 'rgb(0, 0, 255)', border: 'none', radius: '4px', shadow: 'none', padding: '8px 16px', ...over });

test('topShare returns the most common key, its share and the total', () => {
	assert.deepEqual(topShare({ '8px': 6, '4px': 2, '12px': 2 }), { value: '8px', share: 0.6, count: 6, total: 10, distinct: 3 });
	assert.deepEqual(topShare({}), { value: null, share: 0, count: 0, total: 0, distinct: 0 });
});

test('deriveSimilarity counts variants per role and names the properties that differ', () => {
	const s = deriveSimilarity({
		roles: {
			buttons: [
				{ signature: sig(), count: 4, sample },
				{ signature: sig({ radius: '999px', fontWeight: '400' }), count: 1, sample },
				{ signature: sig({ background: 'rgb(0, 128, 0)' }), count: 1, sample }
			],
			links: [],
			cards: [{ signature: sig(), count: 3, sample }]
		},
		radii: { '8px': 3, '999px': 1 },
		shadows: { 'none': 0, 'rgba(0,0,0,.3) 0px 4px 12px 0px': 2 }
	});
	assert.equal(s.roles.buttons.total, 6);
	assert.equal(s.roles.buttons.distinct, 3);
	assert.equal(s.roles.buttons.dominantShare, 0.667);
	assert.deepEqual(s.roles.buttons.differsIn.sort(), ['background', 'fontWeight', 'radius']);
	assert.equal(s.roles.buttons.variants[0].share, 0.667);
	assert.equal(s.roles.cards.distinct, 1);
	assert.deepEqual(s.roles.cards.differsIn, []);
	assert.equal(s.roles.links.total, 0);
	assert.equal(s.radii.distinct, 2);
	assert.equal(s.radii.entries[0].value, '8px');
	assert.equal(s.shadows.top.share, 1);
});

test('deriveRegion reports max depth, a sorted distribution and the deep containers', () => {
	const r = deriveRegion({
		distribution: { 1: 5, 2: 2, 4: 1 },
		deep: [{ selector: 'div', box: { x: 0, y: 0, w: 1, h: 1 }, depth: 4 }]
	});
	assert.equal(r.maxDepth, 4);
	assert.deepEqual(r.distribution, [{ depth: 1, count: 5 }, { depth: 2, count: 2 }, { depth: 4, count: 1 }]);
	assert.equal(r.deep.length, 1);
	assert.equal(r.deepThreshold, 3);
	assert.equal(deriveRegion({ distribution: {}, deep: [] }).maxDepth, 0);
});
