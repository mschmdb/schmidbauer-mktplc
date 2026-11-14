// Repeated word groups in page copy. Pure text logic, no DOM.

/** A token of this length or shorter is "short" (own value). */
const SHORT_TOKEN = 2;

/**
 * Tokens are lower-cased letters and digits; an apostrophe inside a word stays ("berlin's"). Short tokens stay, so phrases only join adjacent words.
 * @param {string} line
 * @returns {string[]}
 */
function wordsOf(line) {
	return line
		.toLowerCase()
		.replace(/\u2019/g, "'")
		.replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
		.split(/\s+/)
		.map((w) => w.replace(/^'+|'+$/g, ''))
		.filter(Boolean);
}

/**
 * Most frequent two- and three-word phrases. Phrases never span a line break, so separate
 * blocks of copy do not merge. Phrases are built from adjacent tokens; a phrase made only of
 * short tokens (two letters or fewer) is dropped. A bigram is dropped when it is part of a surviving trigram.
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
				const tokens = words.slice(i, i + n);
				if (tokens.every((t) => t.length <= SHORT_TOKEN)) continue;
				const gram = tokens.join(' ');
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
