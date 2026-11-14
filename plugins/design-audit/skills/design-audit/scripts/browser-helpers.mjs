// Shared helpers for tests that need a real browser.
// Tests skip with a clear message when Chromium is not installed (pnpm exec playwright install chromium).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runDesignScripts } from './design-scripts.mjs';
import { evaluateAtViewport } from './lib/viewport.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const measureSource = readFileSync(join(here, 'measure.js'), 'utf8');

/** @type {import('playwright').Browser | null} */
let browser = null;

/**
 * Reason to skip browser tests, or false when Chromium launches.
 * @type {string | false}
 */
export const skipReason = await (async () => {
	try {
		browser = await chromium.launch();
		return false;
	} catch (error) {
		return `Chromium is not installed or cannot start (${String(error.message).split('\n')[0]}). Run: pnpm exec playwright install chromium`;
	}
})();

/** Close the shared browser. Call from `after()` in every test file that uses the browser. */
export async function closeBrowser() {
	await browser?.close();
	browser = null;
}

/**
 * Path of a fixture file as file:// URL.
 * @param {string} name file name inside fixtures/
 * @returns {string}
 */
export function fixtureUrl(name) {
	return pathToFileURL(join(here, 'fixtures', name)).href;
}

/**
 * Open a fixture in a fresh context, run `fn(page)`, close the context.
 * @template T
 * @param {string} name fixture file name
 * @param {(page: import('playwright').Page) => Promise<T>} fn
 * @param {import('playwright').BrowserContextOptions} [contextOptions]
 * @returns {Promise<T>}
 */
export async function withFixture(name, fn, contextOptions = { viewport: { width: 1280, height: 800 } }) {
	if (!browser) throw new Error(skipReason || 'browser closed');
	const context = await browser.newContext(contextOptions);
	try {
		const page = await context.newPage();
		await page.goto(fixtureUrl(name));
		return await fn(page);
	} finally {
		await context.close();
	}
}

/**
 * Evaluate measure.js on a fixture, the same way audit.mjs does.
 * @param {string} name fixture file name
 * @param {import('playwright').BrowserContextOptions} [contextOptions]
 * @returns {Promise<any>}
 */
export function measureFixture(name, contextOptions) {
	return withFixture(name, (page) => evaluateAtViewport(page, measureSource), contextOptions);
}

/**
 * Run the design scripts on a fixture and return the merged raw object (before lib post-processing).
 * @param {string} name fixture file name
 * @param {import('playwright').BrowserContextOptions} [contextOptions]
 * @returns {Promise<Record<string, any>>}
 */
export function measureDesignFixture(name, contextOptions) {
	return withFixture(name, (page) => runDesignScripts(page), contextOptions);
}
