// Proximity derivations (G1). The page returns raw gaps; this module computes ratios and violation lists.
// A violation means inner >= outer (equal or worse). The 1.5 ratio from dot-lattice studies is NOT a threshold here:
// ratios are reported so the reader can judge.

/**
 * @param {number | null} numerator
 * @param {number | null} divisor
 * @returns {number | null} numerator / divisor rounded to two digits, null when either is missing or the divisor is 0
 */
export function ratio(numerator, divisor) {
	if (numerator === null || divisor === null || numerator === undefined || divisor === undefined || divisor === 0) return null;
	return Math.round((numerator / divisor) * 100) / 100;
}

/**
 * @param {{ headings: any[], labels: any[], groups: any[] }} raw `proximity` object from measure-design-gestalt.js
 * @returns {{ headings: { items: any[], violations: any[] }, labels: { items: any[], violations: any[] }, groups: { items: any[], violations: any[] }, violations: any[] }}
 */
export function deriveProximity(raw) {
	// Heading: gap above (to previous block) over gap below (to following block). Under 1 means closer to the previous block.
	const headings = raw.headings.map((h) => ({
		...h,
		ratio: ratio(h.gapAbove, h.gapBelow),
		closerToPrevious: h.gapAbove !== null && h.gapBelow !== null && h.gapBelow >= h.gapAbove
	}));
	// Label: nearest other control over own control. Wrapped controls (own gap 0) are never flagged.
	const labels = raw.labels.map((l) => ({
		...l,
		ratio: ratio(l.otherGap, l.ownGap),
		closerToOther: l.ownGap !== null && l.otherGap !== null && l.ownGap > 0 && l.ownGap >= l.otherGap
	}));
	// Group: outer gap over inner gap. Flagged when the inner gap is equal to or larger than the outer gap.
	const groups = raw.groups.map((g) => ({
		...g,
		ratio: ratio(g.outer, g.inner),
		innerNotSmaller: g.inner !== null && g.outer !== null && g.inner >= g.outer
	}));
	const headingViolations = headings.filter((h) => h.closerToPrevious);
	const labelViolations = labels.filter((l) => l.closerToOther);
	const groupViolations = groups.filter((g) => g.innerNotSmaller);
	return {
		headings: { items: headings, violations: headingViolations },
		labels: { items: labels, violations: labelViolations },
		groups: { items: groups, violations: groupViolations },
		violations: [
			...headingViolations.map((v) => ({ kind: 'heading', rule: 'G1', ...v })),
			...labelViolations.map((v) => ({ kind: 'label', rule: 'G1', ...v })),
			...groupViolations.map((v) => ({ kind: 'group', rule: 'G1', ...v }))
		]
	};
}
