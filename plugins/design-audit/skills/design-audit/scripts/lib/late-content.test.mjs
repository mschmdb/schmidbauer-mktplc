import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveLateContent, LATE_REFERENCE_MS, MAX_LATE_ITEMS } from './late-content.mjs';

const box = { x: 0, y: 0, w: 10, h: 10 };
const el = (selector, label = selector) => ({ selector, label, box });

test('lists text visible at the end that was not visible at the reference time', () => {
	const early = { visible: ['h1', 'p'], capped: false };
	const result = deriveLateContent([el('h1'), el('p'), el('h2', 'Late heading')], early);
	assert.deepEqual(result, { referenceMs: LATE_REFERENCE_MS, count: 1, items: [el('h2', 'Late heading')] });
});

test('reports nothing when the early snapshot already showed everything', () => {
	const result = deriveLateContent([el('h1')], { visible: ['h1'], capped: false });
	assert.equal(result.count, 0);
	assert.deepEqual(result.items, []);
});

test('caps the items at 10 but keeps the full count', () => {
	const final = Array.from({ length: 14 }, (_, i) => el(`p:nth-of-type(${i + 1})`));
	const result = deriveLateContent(final, { visible: [], capped: false });
	assert.equal(result.count, 14);
	assert.equal(result.items.length, MAX_LATE_ITEMS);
	assert.equal(MAX_LATE_ITEMS, 10);
});

test('returns null when there is no early snapshot or it was capped', () => {
	assert.equal(deriveLateContent([el('h1')], null), null);
	assert.equal(deriveLateContent([el('h1')], { visible: [], capped: true }), null);
});
