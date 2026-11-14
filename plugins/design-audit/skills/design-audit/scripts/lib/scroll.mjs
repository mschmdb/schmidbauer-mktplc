// Scroll planning. Pure arithmetic, no DOM.

/**
 * Scroll offsets for the scroll series: evenly spaced, top excluded (the load frames cover it),
 * last offset at the bottom of the page. One shot per viewport height, at most `maxShots` including the top.
 * @param {number} pageHeight document scroll height in CSS px
 * @param {number} viewportHeight viewport height in CSS px
 * @param {number} [maxShots] cap on shots including the top of the page
 * @returns {number[]} scroll offsets in CSS px
 */
export function scrollSeriesPositions(pageHeight, viewportHeight, maxShots = 12) {
	if (!(viewportHeight > 0)) throw new RangeError('viewportHeight must be positive');
	const maxScroll = pageHeight - viewportHeight;
	if (maxScroll <= 0) return [];
	const shots = Math.min(maxShots, Math.ceil(pageHeight / viewportHeight));
	if (shots < 2) return [];
	return Array.from({ length: shots - 1 }, (_, i) => Math.round(((i + 1) * maxScroll) / (shots - 1)));
}
