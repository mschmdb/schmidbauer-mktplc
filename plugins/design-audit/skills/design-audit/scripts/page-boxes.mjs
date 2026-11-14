// Document boxes for axe result nodes, so a finding can be cropped.

/**
 * Selector and document box for each axe node. `target` has more than one entry for iframes and shadow roots;
 * those get `box: null` because their coordinates are relative to another document.
 * @param {import('playwright').Page} page page at any scroll position
 * @param {{ target: (string | string[])[] }[]} nodes axe result nodes
 * @returns {Promise<{ selector: string, box: { x: number, y: number, w: number, h: number } | null }[]>}
 */
export function boxesForNodes(page, nodes) {
	const targets = nodes.map((n) => n.target.map((t) => (Array.isArray(t) ? t.join(' ') : t)));
	return page.evaluate(
		(list) =>
			list.map((target) => {
				const selector = target.join(' ');
				const el = target.length === 1 ? document.querySelector(target[0]) : null;
				if (!el) return { selector, box: null };
				const r = el.getBoundingClientRect();
				return { selector, box: { x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) } };
			}),
		targets
	);
}
