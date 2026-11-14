// Press Tab through the page and judge each focus state against the element's unfocused style.
import { focusIndicator } from './lib/focus.mjs';

/** Runs in the page: snapshot of an element's focus-relevant styles and a short label. */
function snapshot(e) {
	const s = getComputedStyle(e);
	return {
		label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 25),
		tag: e.tagName,
		isBody: e === document.body || e === document.documentElement,
		style: {
			outlineStyle: s.outlineStyle,
			outlineWidth: s.outlineWidth,
			outlineColor: s.outlineColor,
			boxShadow: s.boxShadow,
			borderColor: s.borderTopColor,
			backgroundColor: s.backgroundColor,
			color: s.color,
			textDecorationLine: s.textDecorationLine
		}
	};
}

/**
 * @typedef {Object} FocusStep
 * @property {string} element tag and label, e.g. `A "Contact"`
 * @property {string} label
 * @property {boolean} visible a focus indicator differs from the unfocused look
 * @property {string} via which property carries the indicator, or `none`
 */

/**
 * Tab through the page. The element is blurred after each step to read its unfocused style.
 * @param {import('playwright').Page} page
 * @param {number} [steps]
 * @returns {Promise<FocusStep[]>}
 */
export async function focusWalk(page, steps = 10) {
	/** @type {FocusStep[]} */
	const walk = [];
	for (let i = 0; i < steps; i++) {
		await page.keyboard.press('Tab');
		const handle = await page.evaluateHandle(() => document.activeElement);
		const focused = await handle.evaluate(snapshot);
		if (focused.isBody) break;
		// Chromium keeps the sequential focus starting point at a blurred element, so Tab continues from here.
		await handle.evaluate((e) => /** @type {HTMLElement} */ (e).blur());
		const unfocused = await handle.evaluate(snapshot);
		await handle.dispose();
		const { visible, via } = focusIndicator(focused.style, unfocused.style);
		walk.push({ element: `${focused.tag} "${focused.label}"`, label: focused.label, visible, via });
	}
	return walk;
}
