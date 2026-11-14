// Similarity (G2, S5) and common region (G3) derivations. The page returns raw style signatures and depth counts.

/** Nesting depth from which containers are listed (own listing threshold, not a pass or fail value). */
export const DEEP_REGION_DEPTH = 3;

const round = (n, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * @param {Record<string, number>} counts value -> count
 * @returns {{ value: string | null, share: number, count: number, total: number, distinct: number }} most common key and its share
 */
export function topShare(counts) {
	const entries = Object.entries(counts).filter(([, n]) => n > 0);
	const total = entries.reduce((sum, [, n]) => sum + n, 0);
	if (!total) return { value: null, share: 0, count: 0, total: 0, distinct: 0 };
	const [value, count] = entries.sort((a, b) => b[1] - a[1])[0];
	return { value, share: round(count / total), count, total, distinct: entries.length };
}

function summariseRole(variants) {
	const total = variants.reduce((sum, v) => sum + v.count, 0);
	const sorted = [...variants].sort((a, b) => b.count - a.count);
	const props = sorted.length ? Object.keys(sorted[0].signature) : [];
	return {
		total,
		distinct: sorted.length,
		dominantShare: total ? round(sorted[0].count / total) : 0,
		differsIn: props.filter((p) => new Set(sorted.map((v) => v.signature[p])).size > 1),
		variants: sorted.map((v) => ({ signature: v.signature, count: v.count, share: round(v.count / total), sample: v.sample }))
	};
}

function summariseCounts(counts) {
	const entries = Object.entries(counts).filter(([, n]) => n > 0);
	const total = entries.reduce((sum, [, n]) => sum + n, 0);
	return {
		distinct: entries.length,
		total,
		entries: entries.sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count, share: round(count / total) })),
		top: topShare(counts)
	};
}

/**
 * @param {{ roles: Record<string, { signature: Record<string, string>, count: number, sample: object }[]>, radii: Record<string, number>, shadows: Record<string, number> }} raw `similarity` object from measure-design-gestalt.js
 * @returns {{ roles: Record<string, ReturnType<typeof summariseRole>>, radii: ReturnType<typeof summariseCounts>, shadows: ReturnType<typeof summariseCounts> }}
 */
export function deriveSimilarity(raw) {
	return {
		roles: Object.fromEntries(Object.entries(raw.roles).map(([role, variants]) => [role, summariseRole(variants)])),
		radii: summariseCounts(raw.radii),
		shadows: summariseCounts(raw.shadows)
	};
}

/**
 * @param {{ distribution: Record<string, number>, deep: { selector: string, box: object, depth: number }[] }} raw `region` object from measure-design-gestalt.js
 * @returns {{ maxDepth: number, distribution: { depth: number, count: number }[], deepThreshold: number, deep: object[] }}
 */
export function deriveRegion(raw) {
	const distribution = Object.entries(raw.distribution)
		.map(([depth, count]) => ({ depth: Number(depth), count }))
		.sort((a, b) => a.depth - b.depth);
	return {
		maxDepth: distribution.length ? distribution[distribution.length - 1].depth : 0,
		distribution,
		deepThreshold: DEEP_REGION_DEPTH,
		deep: raw.deep
	};
}
