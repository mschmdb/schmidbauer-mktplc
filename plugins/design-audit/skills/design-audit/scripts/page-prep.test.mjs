import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, skipReason, withFixture, fixtureUrl } from './browser-helpers.mjs';
import { scrollWholePage, waitForSettled } from './page-prep.mjs';

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

test('scrollWholePage triggers lazy content and returns to the top (item 3)', opts, async () => {
	await withFixture('lazy.html', async (page) => {
		assert.equal(await page.locator('.lazy.loaded').count(), 1, 'only the first block loads without scrolling');
		const info = await scrollWholePage(page, { pauseMs: 60 });
		assert.equal(await page.locator('.lazy.loaded').count(), 8);
		assert.equal(await page.evaluate(() => window.scrollY), 0);
		assert.equal(info.capped, false);
	}, { viewport: { width: 1000, height: 800 } });
});

test('scrollWholePage stops at maxSteps and says so (item 3)', opts, async () => {
	await withFixture('lazy.html', async (page) => {
		const info = await scrollWholePage(page, { maxSteps: 2, pauseMs: 30 });
		assert.equal(info.capped, true);
		assert.equal(info.steps, 2);
		assert.ok((await page.locator('.lazy.loaded').count()) < 8);
		assert.equal(await page.evaluate(() => window.scrollY), 0);
	}, { viewport: { width: 1000, height: 800 } });
});
