// Repeated word groups in page copy. Pure text logic, no DOM.

/**
 * Words are lower-cased letters and digits longer than two characters.
 * @param {string} line
 * @returns {string[]}
 */
function wordsOf(line) {
	return line
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, ' ')
		.split(/\s+/)
		.filter((w) => w.length > 2);
}

/**
 * Most frequent two- and three-word phrases. Phrases never span a line break, so separate
 * blocks of copy do not merge. A bigram is dropped when it is part of a surviving trigram.
 * @param {string} text copy, one block per line
 * @param {{ minCount?: number, limit?: number }} [options]
 * @returns {Array<[string, number]>} phrase and count, most frequent first
 */
export function repeatedPhrases(text, { minCount = 3, limit = 20 } = {}) {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const line of text.split('\n')) {
		const words = wordsOf(line);
		for (const n of [2, 3]) {
			for (let i = 0; i + n <= words.length; i++) {
				const gram = words.slice(i, i + n).join(' ');
				counts.set(gram, (counts.get(gram) || 0) + 1);
			}
		}
	}
	const surviving = [...counts].filter(([, c]) => c >= minCount);
	const trigrams = surviving.filter(([g]) => g.split(' ').length === 3).map(([g]) => g);
	const insideTrigram = (bigram) => trigrams.some((t) => t.startsWith(`${bigram} `) || t.endsWith(` ${bigram}`));
	return surviving
		.filter(([g]) => g.split(' ').length === 3 || !insideTrigram(g))
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit);
}
