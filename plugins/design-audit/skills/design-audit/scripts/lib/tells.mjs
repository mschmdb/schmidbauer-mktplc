// Tells of the generic look (K2). Counts and shares only: the output reports what was found and never judges.
// Whether a trait is a default or a decision stays a question for the project's DESIGN.md.
import { hueBin, toOklch, CHROMA_THRESHOLD } from './colour.mjs';
import { normalizeFamily } from './typography.mjs';

const DEFAULT_FONTS = new Set([
	'inter', 'roboto', 'arial', 'helvetica', 'helvetica neue',
	'system-ui', 'ui-sans-serif', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'sans-serif'
]);

/**
 * @param {string[]} families normalised font family names of the body text
 * @returns {boolean} true when every family is Inter, Roboto, Arial, Helvetica or a system-ui stack entry; false for an empty list
 */
export function onlyDefaultFonts(families) {
	return families.length > 0 && families.every((f) => DEFAULT_FONTS.has(normalizeFamily(f).toLowerCase()));
}

const BUILDER_PATTERNS = [
	['framer', /framer/i],
	['webflow', /^data-wf-|webflow/i],
	['lovable', /lovable/i],
	['v0', /v0/i],
	['bolt', /bolt/i]
];

/**
 * Names of builders that left a fingerprint: attributes (`data-framer*`, `data-wf-*`), hosts of scripts and links, generator tag.
 * @param {{ generator: string | null, attributes: string[], hosts: string[] }} found
 * @returns {string[]} sorted builder names, empty when nothing matched
 */
export function builderNames(found) {
	const haystacks = [found.generator || '', ...found.attributes, ...found.hosts];
	const names = new Set();
	for (const [name, pattern] of BUILDER_PATTERNS) if (haystacks.some((h) => pattern.test(h))) names.add(name);
	return [...names].sort();
}

const strip = ({ value, share, count }) => ({ value, share, count });

/**
 * @param {Record<string, any>} raw `tells` object from measure-design-view.js
 * @param {{ typography: { families: { family: string }[] }, similarity: { radii: { top: object }, shadows: { top: object } } }} derived already derived design parts
 * @returns {Record<string, any>} keys to merge into `measure.tells`
 */
export function deriveTells(raw, derived) {
	const hues = raw.gradientBackgrounds.colours
		.map(toOklch)
		.filter((c) => c && c.C > CHROMA_THRESHOLD)
		.map((c) => hueBin(c.h));
	return {
		gradientText: raw.gradientText.count,
		gradientTextExamples: raw.gradientText.examples,
		backdropBlurElements: raw.backdropBlur.count,
		backdropBlurExamples: raw.backdropBlur.examples,
		emojiIcons: raw.emojiIcons.count,
		emojiIconExamples: raw.emojiIcons.examples,
		gradientBackgrounds: raw.gradientBackgrounds.count,
		gradientHues: [...new Set(hues)].sort((a, b) => a - b),
		mostCommonRadius: strip(derived.similarity.radii.top),
		mostCommonShadow: strip(derived.similarity.shadows.top),
		identicalCardGroups: raw.identicalCardGroups,
		generator: raw.generator,
		builderFingerprints: { attributes: raw.builders.attributes, hosts: raw.builders.hosts, matched: builderNames({ generator: raw.generator, ...raw.builders }) },
		defaultFontsOnly: onlyDefaultFonts(derived.typography.families.map((f) => f.family))
	};
}
