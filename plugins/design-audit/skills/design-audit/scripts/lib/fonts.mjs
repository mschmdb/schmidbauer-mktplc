// Font family classification. Pure string logic, no DOM.

const MONO_PATTERN =
	/(^|[\s"'-])(mono|monospace|ui-monospace|courier|consolas|menlo|monaco|inconsolata|iosevka|fira code|fira mono|source code|cascadia|sf mono|sfmono|jetbrains|lucida console|andale mono|liberation mono|dejavu sans mono)/i;

/**
 * True for a monospace font stack entry. Names such as "Monotype Corsiva" do not count.
 * @param {string} family one family name as in a computed font-family list, quotes allowed
 * @returns {boolean}
 */
export function isMonoFamily(family) {
	if (/monotype/i.test(family)) return false;
	return MONO_PATTERN.test(family) || /\bmono\b/i.test(family);
}

/**
 * @param {Record<string, number>} familyCounts first family of an element -> number of elements
 * @returns {number} elements that use a monospace family
 */
export function countMonoElements(familyCounts) {
	return Object.entries(familyCounts)
		.filter(([family]) => isMonoFamily(family))
		.reduce((sum, [, n]) => sum + n, 0);
}
