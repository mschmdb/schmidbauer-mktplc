import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeDesignParts } from './design-scripts.mjs';

test('mergeDesignParts merges keys and keeps limits per file', () => {
	const merged = mergeDesignParts([
		['a.js', { limits: { scanned: 3 }, typography: { x: 1 } }],
		['b.js', { limits: { scanned: 5 }, spacing: { y: 2 } }]
	]);
	assert.deepEqual(merged, { limits: { 'a.js': { scanned: 3 }, 'b.js': { scanned: 5 } }, typography: { x: 1 }, spacing: { y: 2 } });
});
