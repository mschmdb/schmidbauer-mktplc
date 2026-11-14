// Spacing (S1, S2, S3) and alignment (G5) derivations. The page script returns raw values; the maths lives here.
// No source gives a pass or fail value for these, so every function reports numbers only.

const round = (n, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;

/** Alignment tolerance in px (own value). */
export const EDGE_TOLERANCE_PX = 2;
/** Side margin below which a text block is listed on narrow screens, in px (own screening value). */
export const NARROW_SIDE_MARGIN_PX = 16;
/** Number of edge clusters reported (own value). */
export const TOP_EDGES = 12;

/**
 * Share of spacing values that sit on a step (a multiple of `step`, within `tolerance` px), weighted by count.
 * @param {Record<string, number>} histogram rounded px value -> count
 * @param {number} step step in px, e.g. 4 or 5
 * @param {number} [tolerance] allowed distance to the nearest multiple, in px
 * @returns {number} 0 to 1, 0 for an empty histogram
 */
export function stepFitShare(histogram, step, tolerance = 1) {
	let total = 0;
	let fitting = 0;
	for (const [value, count] of Object.entries(histogram)) {
		const v = Number(value);
		total += count;
		const offset = v % step;
		if (Math.min(offset, step - offset) <= tolerance) fitting += count;
	}
	return total ? round(fitting / total) : 0;
}

/**
 * @param {Record<string, any>} raw `spacing` object from measure-design.js
 * @returns {Record<string, any>} histogram, distinct count, step fits, section paddings and side margins
 */
export function deriveSpacing(raw) {
	const histogram = Object.entries(raw.histogram)
		.map(([px, count]) => ({ px: Number(px), count }))
		.sort((a, b) => b.count - a.count || a.px - b.px);
	const paddings = raw.sections.flatMap((s) => [s.paddingTop, s.paddingBottom]);
	const left = raw.sideMargins.map((m) => m.left);
	const right = raw.sideMargins.map((m) => m.right);
	return {
		total: histogram.reduce((sum, h) => sum + h.count, 0),
		distinct: histogram.length,
		histogram: histogram.slice(0, 40),
		fit4: stepFitShare(raw.histogram, 4, 1),
		fit5: stepFitShare(raw.histogram, 5, 1),
		fit4Exact: stepFitShare(raw.histogram, 4, 0),
		fit5Exact: stepFitShare(raw.histogram, 5, 0),
		sections: {
			items: raw.sections,
			distinctPaddings: new Set(paddings).size,
			paddingRange: paddings.length ? [Math.min(...paddings), Math.max(...paddings)] : null
		},
		sideMargins: {
			minLeft: left.length ? Math.min(...left) : null,
			minRight: right.length ? Math.min(...right) : null,
			narrow: raw.sideMargins.filter((m) => Math.min(m.left, m.right) < NARROW_SIDE_MARGIN_PX)
		}
	};
}

/**
 * Group left edges: an edge joins the open cluster when it is within `tolerance` px of the cluster's first edge.
 * @param {{ x: number, selector: string, box: object }[]} items text blocks with their left edge
 * @param {number} [tolerance]
 * @returns {{ x: number, count: number, samples: { selector: string, box: object }[] }[]} clusters by count, then position; x is the rounded mean
 */
export function clusterEdges(items, tolerance = EDGE_TOLERANCE_PX) {
	const sorted = [...items].sort((a, b) => a.x - b.x);
	const clusters = [];
	for (const item of sorted) {
		const last = clusters[clusters.length - 1];
		if (last && item.x - last.start <= tolerance) last.items.push(item);
		else clusters.push({ start: item.x, items: [item] });
	}
	return clusters
		.map((c) => ({
			x: Math.round(c.items.reduce((sum, i) => sum + i.x, 0) / c.items.length),
			count: c.items.length,
			samples: c.items.slice(0, 3).map(({ selector, box }) => ({ selector, box }))
		}))
		.sort((a, b) => b.count - a.count || a.x - b.x);
}

/**
 * @param {{ edges: { x: number, selector: string, box: object }[] }} raw `alignment` object from measure-design.js
 * @returns {{ tolerance: number, distinct: number, top: ReturnType<typeof clusterEdges> }}
 */
export function deriveAlignment(raw) {
	const clusters = clusterEdges(raw.edges, EDGE_TOLERANCE_PX);
	return { tolerance: EDGE_TOLERANCE_PX, distinct: clusters.length, top: clusters.slice(0, TOP_EDGES) };
}
