// Turns the raw page object from measure.js into the result stored in audit.json.
// measure.js stays DOM-only and self-contained; text and font classification lives in lib/.
import { countMonoElements } from './fonts.mjs';
import { repeatedPhrases } from './ngrams.mjs';

/**
 * @param {Record<string, any>} raw object returned by measure.js
 * @returns {Record<string, any>} copy without the raw helper fields, plus derived fields
 */
export function finishMeasure(raw) {
	const { contentText, fontsOutsideCode, ...rest } = raw;
	return {
		...rest,
		tells: { ...raw.tells, monoTextElements: countMonoElements(fontsOutsideCode || {}) },
		repeated: repeatedPhrases(contentText || '')
	};
}
