// Late content (first viewport): text and media that are visible in the final measurement but were not visible
// (not rendered, opacity 0, not loaded or outside the viewport) about 1000 ms after navigation. Pure logic, no DOM.

/** Time after navigation at which the early snapshot is taken (own value). */
export const LATE_REFERENCE_MS = 1000;
/** Reported items; `count` still holds the full number (own value). */
export const MAX_LATE_ITEMS = 10;

/**
 * @param {{ selector: string, label: string, box: object }[]} finalText text elements visible in the first viewport at the final measurement
 * @param {{ visible: string[], visibleMedia?: string[], capped: boolean } | null} early selectors visible in the first viewport at the reference time, from snapshot-first-viewport.js
 * @param {{ selector: string, label: string, kind: string, box: object }[]} [finalMedia] loaded images, video, canvas, large svg and background images in the first viewport at the final measurement
 * @returns {{ referenceMs: number, count: number, items: object[], media: { count: number, items: object[] } | null } | null}
 *   null when no usable snapshot exists (missing or capped, so the diff would be unreliable); `media` is null when the snapshot lists no media
 */
export function deriveLateContent(finalText, early, finalMedia = []) {
	if (!early || early.capped) return null;
	const seen = new Set(early.visible);
	const late = finalText.filter((t) => !seen.has(t.selector));
	const seenMedia = early.visibleMedia ? new Set(early.visibleMedia) : null;
	const lateMedia = seenMedia ? finalMedia.filter((m) => !seenMedia.has(m.selector)) : null;
	return {
		referenceMs: LATE_REFERENCE_MS,
		count: late.length,
		items: late.slice(0, MAX_LATE_ITEMS).map(({ selector, label, box }) => ({ selector, label, box })),
		media: lateMedia && { count: lateMedia.length, items: lateMedia.slice(0, MAX_LATE_ITEMS).map(({ selector, label, kind, box }) => ({ selector, label, kind, box })) }
	};
}
