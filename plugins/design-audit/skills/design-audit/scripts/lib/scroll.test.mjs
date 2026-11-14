import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrollSeriesPositions } from './scroll.mjs';

test('a page that fits the viewport needs no scroll shots', () => {
	assert.deepEqual(scrollSeriesPositions(800, 900), []);
	assert.deepEqual(scrollSeriesPositions(900, 900), []);
});

test('a two-screen page gets one shot at the bottom', () => {
	assert.deepEqual(scrollSeriesPositions(1800, 900), [900]);
});

test('shots are evenly spaced, skip the top and end at the bottom', () => {
	assert.deepEqual(scrollSeriesPositions(3600, 900), [900, 1800, 2700]);
});

test('long pages are capped at maxShots and still reach the bottom', () => {
	const positions = scrollSeriesPositions(50000, 900);
	assert.equal(positions.length, 11);
	assert.equal(positions.at(-1), 50000 - 900);
	const gaps = positions.slice(1).map((y, i) => y - positions[i]);
	assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 1, 'even spacing');
});

test('gaps never exceed one viewport on pages that fit under the cap', () => {
	const viewport = 900;
	const positions = [0, ...scrollSeriesPositions(7000, viewport)];
	const gaps = positions.slice(1).map((y, i) => y - positions[i]);
	assert.ok(gaps.every((g) => g <= viewport));
});

test('rejects non-positive viewport heights', () => {
	assert.throws(() => scrollSeriesPositions(1000, 0), /viewport/i);
});
