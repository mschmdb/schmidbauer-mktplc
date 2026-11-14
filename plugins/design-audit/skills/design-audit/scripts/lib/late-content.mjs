// Late content (first viewport): text that is visible in the final measurement but was not visible
// (not rendered, opacity 0 or outside the viewport) about 1000 ms after navigation. Pure logic, no DOM.

/** Time after navigation at which the early snapshot is taken (own value). */
export const LATE_REFERENCE_MS = 1000;
/** Reported items; `count` still holds the full number (own value). */
export const MAX_LATE_ITEMS = 10;

/**
 * @param {{ selector: string, label: string, box: object }[]} finalText text elements visible in the first viewport at the final measurement
 * @param {{ visible: string[], capped: boolean } | null} early selectors visible in the first viewport at the reference time, from snapshot-first-viewport.js
 * @returns {{ referenceMs: number, count: number, items: { selector: string, label: string, box: object }[] } | null}
 *   null when no usable snapshot exists (missing or capped, so the diff would be unreliable)
 */
export function deriveLateContent(finalText, early) {
	if (!early || early.capped) return null;
	const seen = new Set(early.visible);
	const late = finalText.filter((t) => !seen.has(t.selector));
	return {
		referenceMs: LATE_REFERENCE_MS,
		count: late.length,
		items: late.slice(0, MAX_LATE_ITEMS).map(({ selector, label, box }) => ({ selector, label, box }))
	};
}
