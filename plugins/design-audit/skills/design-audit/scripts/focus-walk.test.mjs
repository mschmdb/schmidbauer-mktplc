import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, skipReason, withFixture } from './browser-helpers.mjs';
import { focusWalk } from './focus-walk.mjs';

after(closeBrowser);

test('focusWalk separates real focus indicators from transparent outlines (item 7)', { skip: skipReason }, async () => {
	const walk = await withFixture('focus.html', (page) => focusWalk(page, 4));
	assert.equal(walk.length, 4);
	const byLabel = Object.fromEntries(walk.map((w) => [w.label, w]));
	assert.deepEqual([byLabel['default ring'].visible, byLabel['default ring'].via], [true, 'outline']);
	assert.equal(byLabel['transparent outline'].visible, false);
	assert.deepEqual([byLabel['box shadow ring'].visible, byLabel['box shadow ring'].via], [true, 'box-shadow']);
	assert.deepEqual([byLabel['border colour'].visible, byLabel['border colour'].via], [true, 'border']);
});
