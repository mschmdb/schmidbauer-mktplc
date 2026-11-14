// The viewport a page was audited at. Mobile emulation widens window.innerWidth and innerHeight
// when the page overflows horizontally, so the page scripts read the configured size instead.
// They find it on `window.__auditViewport`; without it they fall back to clientWidth and innerHeight.

/**
 * Evaluate an injectable script with the configured viewport size available to it.
 * @param {import('playwright').Page} page
 * @param {string} source script text (an expression that returns a JSON-serialisable value)
 * @returns {Promise<any>}
 */
export async function evaluateAtViewport(page, source) {
	const size = page.viewportSize();
	if (size) await page.evaluate((s) => { window.__auditViewport = s; }, size);
	try {
		return await page.evaluate(source);
	} finally {
		if (size) await page.evaluate(() => { delete window.__auditViewport; }).catch(() => {});
	}
}
