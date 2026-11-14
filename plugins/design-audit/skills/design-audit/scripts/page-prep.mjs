// Page preparation shared by audit.mjs: settle detection and scrolling.
// Both run in Playwright; the pure planning logic lives in lib/.

/**
 * @typedef {Object} SettleState
 * @property {boolean} fontsReady `document.fonts.ready` resolved before the timeout
 * @property {boolean} quiet no DOM change during the last `quietMs` before the timeout
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
				document.fonts.ready.then(() => {
					fontsReady = true;
				});
				const observer = new MutationObserver(() => {
					lastChange = performance.now();
				});
				observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
				const timer = setInterval(() => {
					const now = performance.now();
					const quiet = now - lastChange >= quietMs;
					if ((fontsReady && quiet) || now - started >= timeoutMs) {
						clearInterval(timer);
						observer.disconnect();
						resolve({ fontsReady, quiet });
					}
				}, 50);
			}),
		{ quietMs, timeoutMs }
	);
}
