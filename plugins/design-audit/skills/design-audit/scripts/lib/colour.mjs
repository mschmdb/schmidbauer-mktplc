// Colour derivations (C1, C2, C3): OKLCH conversion, hue families, accent colours, lightness spread.
// The sRGB parser lives in contrast.mjs and is reused here. Pure logic, no DOM.
import { composite, parseColor } from '../contrast.mjs';

/** Colours with an OKLCH chroma above this value count as chromatic (own value; tinted greys stay below about 0.03). */
export const CHROMA_THRESHOLD = 0.04;
/** Width of a hue bin in degrees (own value). */
export const HUE_BIN_DEGREES = 30;

const round = (n, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;
const WHITE = { r: 255, g: 255, b: 255, a: 1 };

const linear = (channel255) => {
	const c = channel255 / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/**
 * Convert a CSS colour to OKLCH (Ottosson 2020). Alpha is returned, not applied.
 * @param {string} css hex, rgb(), color(srgb ...), oklch() or oklab()
 * @returns {{ L: number, C: number, h: number, alpha: number } | null} null when the colour cannot be parsed; h in degrees 0-360
 */
export function toOklch(css) {
	let rgb;
	try {
		rgb = parseColor(css);
	} catch {
		return null;
	}
	const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => linear(Math.min(255, Math.max(0, c))));
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	const hue = (Math.atan2(bb, a) * 180) / Math.PI;
	return { L, C: Math.hypot(a, bb), h: (hue + 360) % 360, alpha: rgb.a };
}

/**
 * @param {number} hue degrees, any value
 * @returns {number} lower edge of the 30 degree bin, 0 to 330
 */
export function hueBin(hue) {
	const wrapped = ((hue % 360) + 360) % 360;
	return Math.floor(wrapped / HUE_BIN_DEGREES) * HUE_BIN_DEGREES;
}

/** OKLCH of a colour as it looks on white; null when unparsable or fully transparent. */
function visibleOklch(css) {
	let rgb;
	try {
		rgb = parseColor(css);
	} catch {
		return null;
	}
	if (rgb.a === 0) return null;
	const flat = composite(rgb, WHITE);
	return toOklch(`rgb(${flat.r}, ${flat.g}, ${flat.b})`);
}

/**
 * Hue families of a weighted colour set. Colours above the chroma threshold are binned by hue.
 * @param {Record<string, number>} weighted CSS colour -> weight (text length for text, painted area for backgrounds)
 * @returns {{ totalWeight: number, neutralShare: number, families: { hue: number, weight: number, share: number, colours: string[] }[] }} families by weight; share is of the total weight
 */
export function hueFamilies(weighted) {
	let totalWeight = 0;
	let neutralWeight = 0;
	const bins = new Map();
	for (const [css, weight] of Object.entries(weighted)) {
		const lch = visibleOklch(css);
		if (!lch) continue; // unparsable or fully transparent colours carry no weight
		totalWeight += weight;
		if (lch.C <= CHROMA_THRESHOLD) {
			neutralWeight += weight;
			continue;
		}
		const bin = bins.get(hueBin(lch.h)) || { hue: hueBin(lch.h), weight: 0, colours: [] };
		bin.weight += weight;
		bin.colours.push(css);
		bins.set(bin.hue, bin);
	}
	return {
		totalWeight,
		neutralShare: totalWeight ? round(neutralWeight / totalWeight) : 0,
		families: [...bins.values()]
			.sort((a, b) => b.weight - a.weight)
			.map((b) => ({ hue: b.hue, weight: b.weight, share: round(b.weight / totalWeight), colours: b.colours.slice(0, 5) }))
	};
}

const spreadOf = (values) => {
	if (!values.length) return { n: 0, min: null, max: null, spread: null };
	const [min, max] = [Math.min(...values), Math.max(...values)];
	return { n: values.length, min: round(min), max: round(max), spread: round(max - min) };
};

/**
 * Lightness spread (OKLCH L) over a set of colours, overall and for the chromatic ones.
 * @param {string[]} colours CSS colours
 * @returns {{ n: number, min: number | null, max: number | null, spread: number | null, chromatic: { n: number, min: number | null, max: number | null, spread: number | null } }}
 */
export function lightnessSpread(colours) {
	const parsed = [...new Set(colours)].map(visibleOklch).filter(Boolean);
	return { ...spreadOf(parsed.map((c) => c.L)), chromatic: spreadOf(parsed.filter((c) => c.C > CHROMA_THRESHOLD).map((c) => c.L)) };
}

const isFilled = (css) => {
	try {
		return parseColor(css).a > 0;
	} catch {
		return false;
	}
};

/**
 * @param {{ text: Record<string, number>, backgrounds: Record<string, number>, interactive: { kind: 'button' | 'link', color: string, background: string, selector: string, box: object }[] }} raw `colour` object from measure-design-gestalt.js
 * @returns {Record<string, any>} hue families for text and backgrounds, accent candidates on interactive elements, lightness spread per role
 */
export function deriveColour(raw) {
	// Accent candidate of an interactive element: the fill of a button, else its text colour; links use the text colour.
	const accentOf = (item) => (item.kind === 'button' && isFilled(item.background) ? item.background : item.color);
	const accents = new Map();
	for (const item of raw.interactive) {
		const colour = accentOf(item);
		const lch = visibleOklch(colour);
		if (!lch || lch.C <= CHROMA_THRESHOLD) continue;
		const entry = accents.get(colour) || { colour, hue: hueBin(lch.h), count: 0, kinds: [], sample: { selector: item.selector, box: item.box } };
		entry.count += 1;
		if (!entry.kinds.includes(item.kind)) entry.kinds.push(item.kind);
		accents.set(colour, entry);
	}
	const accentList = [...accents.values()].sort((a, b) => b.count - a.count);
	const buttons = raw.interactive.filter((i) => i.kind === 'button');
	return {
		threshold: { chroma: CHROMA_THRESHOLD, hueBinDegrees: HUE_BIN_DEGREES },
		text: hueFamilies(raw.text),
		backgrounds: hueFamilies(raw.backgrounds),
		accents: accentList,
		accentHues: [...new Set(accentList.map((a) => a.hue))].sort((a, b) => a - b),
		lightness: {
			text: lightnessSpread(Object.keys(raw.text)),
			background: lightnessSpread(Object.keys(raw.backgrounds)),
			buttonBackground: lightnessSpread(buttons.map((b) => b.background).filter(isFilled)),
			linkText: lightnessSpread(raw.interactive.filter((i) => i.kind === 'link').map((i) => i.color))
		}
	};
}
