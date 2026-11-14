import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureFixture, skipReason } from './browser-helpers.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('cardLikeBoxes ignores preflight borders and transparent boxes (item 1)', opts, async () => {
	const m = await measureFixture('cards-preflight.html');
	assert.equal(m.tells.cardLikeBoxes, 3);
});
