// Page preparation shared by audit.mjs: settle detection and scrolling.
// Both run in Playwright; the pure planning logic lives in lib/.

/**
 * @typedef {Object} SettleState
 * @property {boolean} fontsReady `document.fonts.ready` resolved before the timeout
 * @property {boolean} quiet no DOM change during the last `quietMs` before the timeout
 * @property {string | null} lastMutation tag, id and first classes of the node that changed last, `null` when nothing changed
 * @property {number} runningAnimations Web Animations running at the end
 * @property {number} infiniteAnimations of those, the ones that repeat forever
 */

/**
 * Wait until web fonts are ready and the DOM has been quiet for `quietMs`, or until the timeout.
 * Replaces `networkidle`, which never fires on pages with polling, analytics or streaming.
 * @param {import('playwright').Page} page page after the `load` event
 * @param {{ quietMs?: number, timeoutMs?: number }} [options]
 * @returns {Promise<SettleState>}
 */
export function waitForSettled(page, { quietMs = 500, timeoutMs = 8000 } = {}) {
	return page.evaluate(
		({ quietMs, timeoutMs }) =>
			new Promise((resolve) => {
				const started = performance.now();
				let lastChange = started;
				let fontsReady = false;
				let lastMutation = null;
				const describe = (node) => {
					const el = node.nodeType === 1 ? node : node.parentElement;
					if (!el) return null;
					const classes = [...el.classList].slice(0, 2).map((c) => `.${c}`).join('');
					return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${classes}`;
				};
				document.fonts.ready.then(() => {
					fontsReady = true;
				});
				const observer = new MutationObserver((records) => {
					lastChange = performance.now();
					lastMutation = describe(records[records.length - 1].target);
				});
				observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
				const timer = setInterval(() => {
					const now = performance.now();
					const quiet = now - lastChange >= quietMs;
					if ((fontsReady && quiet) || now - started >= timeoutMs) {
						clearInterval(timer);
						observer.disconnect();
						const animations = document.getAnimations();
						resolve({
							fontsReady,
							quiet,
							lastMutation,
							runningAnimations: animations.length,
							infiniteAnimations: animations.filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length
						});
					}
				}, 50);
			}),
		{ quietMs, timeoutMs }
	);
}

/**
 * @typedef {Object} ScrollInfo
 * @property {number} steps scroll steps taken
 * @property {boolean} capped stopped at `maxSteps` before the bottom
 * @property {number} height document height after scrolling, in CSS px
 */

/**
 * Scroll through the whole page so lazy images and reveal animations load, then return to the top.
 * The height is read again at every step because lazy content can grow the page.
 * @param {import('playwright').Page} page
 * @param {{ maxSteps?: number, pauseMs?: number }} [options]
 * @returns {Promise<ScrollInfo>}
 */
export async function scrollWholePage(page, { maxSteps = 30, pauseMs = 150 } = {}) {
	const viewportHeight = await page.evaluate(() => window.innerHeight);
	let steps = 0;
	let height = await page.evaluate(() => document.documentElement.scrollHeight);
	let y = 0;
	while (steps < maxSteps && y + viewportHeight < height) {
		y += viewportHeight;
		// `instant`: `scroll-behavior: smooth` would leave the page mid-scroll.
		await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
		await page.waitForTimeout(pauseMs);
		steps++;
		height = await page.evaluate(() => document.documentElement.scrollHeight);
	}
	const capped = y + viewportHeight < height;
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	await page.waitForTimeout(pauseMs);
	return { steps, capped, height };
}
