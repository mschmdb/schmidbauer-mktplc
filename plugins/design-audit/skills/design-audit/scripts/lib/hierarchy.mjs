// Hierarchy (H1, H3) and first viewport (P1, P2) derivations. The page returns raw geometry; weights and shares are derived here.

/** Elements whose visual weight is at least this share of the largest count as competing (own target, 20 percent). */
export const NEAR_LARGEST = 0.8;
/** Number of weight entries reported (own value). */
export const TOP_WEIGHTS = 10;

const round = (n, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * @param {{ primaryButtons: { selector: string, box: object, label: string, background: string, color: string }[] }} raw `hierarchy` object from measure-design-view.js
 * @returns {{ primaryButtons: { count: number, items: object[] } }}
 */
export function deriveHierarchy(raw) {
	return { primaryButtons: { count: raw.primaryButtons.length, items: raw.primaryButtons } };
}

/**
 * Visual weight is the proxy `text area in px squared x font size in px`, not a perception model.
 * @param {Record<string, any>} raw `firstViewport` object from measure-design-view.js
 * @returns {Record<string, any>} h1, weights (top list and near-largest group), media share, overlays and text over images
 */
export function deriveFirstViewport(raw) {
	const weighted = raw.weights
		.map((w) => ({ ...w, weight: Math.round(w.area * w.fontSize) }))
		.sort((a, b) => b.weight - a.weight);
	const max = weighted.length ? weighted[0].weight : 0;
	const withRelative = weighted.map((w) => ({ ...w, relative: max ? round(w.weight / max) : 0 }));
	const near = withRelative.filter((w) => w.relative >= NEAR_LARGEST);
	return {
		width: raw.width,
		height: raw.height,
		h1: {
			present: raw.h1.present,
			anywhere: raw.h1.anywhere,
			selector: raw.h1.selector ?? null,
			box: raw.h1.box ?? null,
			fontSize: raw.h1.fontSize ? parseFloat(raw.h1.fontSize) : null,
			words: raw.h1.words ?? null
		},
		weights: {
			method: 'text area in px squared times font size in px; a proxy, not eye tracking',
			top: withRelative.slice(0, TOP_WEIGHTS),
			nearLargest: { threshold: NEAR_LARGEST, count: near.length, competing: near.length > 1, items: near }
		},
		media: raw.media,
		overlays: raw.overlays,
		textOverImage: raw.textOverImage
	};
}
