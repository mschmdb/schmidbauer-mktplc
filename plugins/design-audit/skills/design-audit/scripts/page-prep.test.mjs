import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, skipReason, withFixture, fixtureUrl } from './browser-helpers.mjs';
import { waitForSettled } from './page-prep.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('waitForSettled waits for fonts and a quiet DOM, then reports it (item 10)', opts, async () => {
	await withFixture('settle.html', async (page) => {
		const state = await waitForSettled(page, { quietMs: 250, timeoutMs: 5000 });
		assert.equal(state.fontsReady, true);
		assert.equal(state.quiet, true);
		assert.equal(await page.evaluate(() => window.__mutationsDone), true);
	});
});

test('waitForSettled gives up at the timeout when the DOM never goes quiet (item 10)', opts, async () => {
	await withFixture('settle.html', async (page) => {
		await page.goto(`${fixtureUrl('settle.html')}?forever`);
		const started = Date.now();
		const state = await waitForSettled(page, { quietMs: 250, timeoutMs: 1000 });
		const took = Date.now() - started;
		assert.equal(state.quiet, false);
		assert.ok(took >= 900 && took < 3000, `took ${took} ms`);
	});
});
