// Prominence ranking (H2): a PREDICTION of which first-viewport elements draw attention first. It is not eye tracking.
//
// score = areaShare x contrast x type x position
//   areaShare  visible area of the element's text (a filled button: its whole box; media: its box) divided by the viewport area
//   contrast   (WCAG contrast ratio - 1) / 20, floor 0.02; the larger of label-on-own-fill and own-fill-on-the-background-behind
//              (so a filled button counts even when its label is weak; an outlined one has no fill and only its label counts);
//              media boxes use 0.5
//   type       (font size / 16 px) x (font weight / 400), weight clamped to 100..900
//   position   1 - 0.3 x (centre x / width) - 0.3 x (centre y / height), clamped to 0.4..1: favours the top left
// The factors are the choice of this rule set (own values), loosely following left and top bias in eye-tracking
// studies. Top 8 elements are reported.
import { pairRatio } from '../contrast.mjs';

/** Description written into the output next to the ranking. */
export const METHOD =
	'prediction, not eye tracking: score = area share of the viewport (filled buttons: whole box, others: text) x ((larger of label-on-fill and fill-on-surround contrast ratio - 1) / 20) x (font size / 16) x (font weight / 400) x position prior (1 - 0.3 x x / width - 0.3 x y / height, min 0.4); media use contrast 0.5';
/** Number of ranked elements (own value). */
export const TOP_PROMINENT = 8;
const CONTRAST_FLOOR = 0.02;
const MEDIA_CONTRAST = 0.5;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * @param {number} cx element centre x in px
 * @param {number} cy element centre y in px
 * @param {number} width viewport width
 * @param {number} height viewport height
 * @returns {number} 1 at the top left corner down to 0.4 at the bottom right
 */
export function positionPrior(cx, cy, width, height) {
	return clamp(1 - 0.3 * (cx / width) - 0.3 * (cy / height), 0.4, 1);
}

/**
 * @param {number} fontSize px
 * @param {string} fontWeight computed weight, number or keyword
 * @returns {number} (size / 16) x (weight / 400)
 */
export function typeFactor(fontSize, fontWeight) {
	const named = { normal: 400, bold: 700 };
	const weight = clamp(Number(named[fontWeight] ?? fontWeight) || 400, 100, 900);
	return (fontSize / 16) * (weight / 400);
}

const safeRatio = (fg, bg) => {
	try {
		return pairRatio(fg, bg);
	} catch {
		return 1;
	}
};

/**
 * @param {{ kind: string, color?: string, background?: string, surround?: string }} candidate
 * @returns {number} 0.02 to 1 for text and buttons, 0.5 for media
 */
export function contrastFactor(candidate) {
	if (candidate.kind === 'media') return MEDIA_CONTRAST;
	const textOnFill = safeRatio(candidate.color, candidate.background);
	const fillOnSurround = safeRatio(candidate.background, candidate.surround);
	return clamp((Math.max(textOnFill, fillOnSurround) - 1) / 20, CONTRAST_FLOOR, 1);
}

/**
 * @param {Record<string, any>} candidate raw candidate from measure-design-view.js
 * @param {{ width: number, height: number }} view viewport size in px
 * @returns {number} score, higher means more prominent
 */
export function scoreCandidate(candidate, view) {
	const areaShare = candidate.area / (view.width * view.height);
	return (
		areaShare *
		contrastFactor(candidate) *
		typeFactor(candidate.fontSize, candidate.fontWeight) *
		positionPrior(candidate.cx, candidate.cy, view.width, view.height)
	);
}

/**
 * @param {Record<string, any>[]} candidates `prominence.candidates` from measure-design-view.js
 * @param {{ width: number, height: number }} view viewport size in px
 * @returns {{ method: string, items: { rank: number, selector: string, label: string, kind: string, box: object, score: number, relative: number }[] }}
 */
export function rankProminence(candidates, view) {
	const scored = candidates.map((c) => ({ c, score: scoreCandidate(c, view) })).sort((a, b) => b.score - a.score);
	const top = scored.slice(0, TOP_PROMINENT);
	const best = top.length ? top[0].score : 0;
	return {
		method: METHOD,
		items: top.map(({ c, score }, i) => ({
			rank: i + 1,
			selector: c.selector,
			label: c.label,
			kind: c.kind,
			box: c.box,
			score: Number(score.toPrecision(4)),
			relative: best ? Math.round((score / best) * 1000) / 1000 : 0
		}))
	};
}
