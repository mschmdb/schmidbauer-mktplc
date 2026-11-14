import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, skipReason, withFixture } from './browser-helpers.mjs';
import { boxesForNodes } from './page-boxes.mjs';

after(closeBrowser);

test('axe nodes get a selector and a document box; nested targets and missing nodes get null', { skip: skipReason }, async () => {
	const result = await withFixture('targets.html', (page) =>
		boxesForNodes(page, [{ target: ['button[aria-label="isolated"]'] }, { target: [['iframe', 'button']] }, { target: ['#nothing'] }])
	);
	assert.equal(result[0].selector, 'button[aria-label="isolated"]');
	assert.deepEqual([result[0].box.w, result[0].box.h], [16, 16]);
	assert.equal(result[1].box, null);
	assert.equal(result[2].box, null);
});
