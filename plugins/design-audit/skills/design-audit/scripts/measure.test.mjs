import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureFixture, skipReason } from './browser-helpers.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('cardLikeBoxes ignores preflight borders and transparent boxes (item 1)', opts, async () => {
	const m = await measureFixture('cards-preflight.html');
	assert.equal(m.tells.cardLikeBoxes, 3);
});

test('text counts skip opacity 0, sr-only, off-screen and aria-hidden text (item 2)', opts, async () => {
	const m = await measureFixture('hidden-text.html');
	assert.deepEqual(Object.keys(m.sizes), ['18px']);
});

test('smallTargets skips inline text links and hidden inputs, tests spacing, reports a total (item 5)', opts, async () => {
	const m = await measureFixture('targets.html');
	assert.equal(m.smallTargets.total, 3);
	assert.equal(m.smallTargets.failingSpacing, 2);
	assert.equal(m.smallTargets.items.length, 3);
	assert.ok(!m.smallTargets.items.some((i) => /terms|Newsletter/.test(i)));
	assert.ok(m.smallTargets.items.some((i) => /isolated/.test(i) && /spacing ok/.test(i)));
});
