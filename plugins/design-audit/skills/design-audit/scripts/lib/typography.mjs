// Typography derivations for the design measurements (T1, T2, T4, T5, T6, T7).
// The page script returns raw counts; this module normalises and summarises them. Pure logic, no DOM.

const ICON_FONT_PATTERN =
	/(font ?awesome|material (icons|symbols)|\bicons?\b|ionicons|glyphicons|fontello|remixicon|codicon|dashicons|feather|lucide|bootstrap-icons|icomoon|themify|linearicons)/i;

/**
 * Strip quotes, framework hash suffixes (`__Inter_a1b2c3`), `Fallback` and `Variable` markers.
 * @param {string} raw first entry of a computed `font-family` list
 * @returns {string}
 */
export function normalizeFamily(raw) {
	let name = raw.trim().replace(/^["']|["']$/g, '').trim();
	const hashed = name.match(/^__(.+?)(?:_[0-9a-f]{6,})$/i) || name.match(/^__(.+)$/);
	if (hashed) name = hashed[1].replace(/_/g, ' ');
	return name.replace(/\s+(Fallback|Variable)$/i, '').trim();
}

/**
 * @param {string} name normalised family name
 * @returns {boolean} true for common icon font names
 */
export function isIconFont(name) {
	return ICON_FONT_PATTERN.test(name);
}

const round = (n, digits) => Math.round(n * 10 ** digits) / 10 ** digits;
const pxOf = (value) => parseFloat(value);

/**
 * @param {number[]} sizes font sizes in px, any order
 * @returns {{ from: number, to: number, ratio: number }[]} ratio of each size to the next smaller one, ascending
 */
export function neighbourRatios(sizes) {
	const sorted = [...new Set(sizes)].sort((a, b) => a - b);
	return sorted.slice(1).map((to, i) => ({ from: sorted[i], to, ratio: round(to / sorted[i], 3) }));
}

const median = (numbers) => {
	const sorted = [...numbers].sort((a, b) => a - b);
	if (!sorted.length) return null;
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : round((sorted[mid - 1] + sorted[mid]) / 2, 3);
};

function weighted(counts, parse) {
	const entries = Object.entries(counts).map(([key, chars]) => ({ key: parse(key), chars }));
	const total = entries.reduce((sum, e) => sum + e.chars, 0);
	return { entries: entries.sort((a, b) => b.chars - a.chars), total };
}

function lineHeightSummary(items) {
	const samples = items.map((item) => ({
		selector: item.selector,
		box: item.box,
		fontSize: item.fontSize,
		ratio: item.lineHeightPx === null ? null : round(item.lineHeightPx / item.fontSize, 3)
	}));
	const ratios = samples.map((s) => s.ratio).filter((r) => r !== null);
	return { median: median(ratios), normalCount: samples.length - ratios.length, samples };
}

/**
 * @param {Record<string, any>} raw `typography` object from measure-design.js
 * @returns {Record<string, any>} families, weights, sizes with ratios, body size, h1, line heights, caps, justified and centred text
 */
export function deriveTypography(raw) {
	const merged = new Map();
	for (const [family, use] of Object.entries(raw.families)) {
		const name = normalizeFamily(family);
		if (isIconFont(name) || use.text === 0) continue;
		merged.set(name, (merged.get(name) || 0) + use.text);
	}
	const familyTotal = [...merged.values()].reduce((a, b) => a + b, 0);
	const families = [...merged.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([family, chars]) => ({ family, chars, share: round(chars / familyTotal, 3) }));

	const weights = weighted(raw.weights, Number);
	const weightList = weights.entries.map((e) => ({ weight: e.key, chars: e.chars, share: round(e.chars / weights.total, 3) }));
	const lightChars = weights.entries.filter((e) => e.key <= 300).reduce((sum, e) => sum + e.chars, 0);

	const sizes = weighted(raw.sizes, pxOf);
	const sizeList = [...sizes.entries].sort((a, b) => a.key - b.key).map((e) => ({ px: e.key, chars: e.chars, share: round(e.chars / sizes.total, 3) }));

	const main = weighted(raw.mainSizes, pxOf);
	const bodySize = main.entries.length ? main.entries[0].key : null;
	const h1Size = raw.h1 ? pxOf(raw.h1.fontSize) : null;

	return {
		families,
		weights: weightList,
		lightWeightShare: weights.total ? round(lightChars / weights.total, 3) : 0,
		sizes: sizeList,
		sizeRatios: neighbourRatios(sizeList.map((s) => s.px)),
		bodySize,
		h1: raw.h1 ? { selector: raw.h1.selector, box: raw.h1.box, fontSize: h1Size, words: raw.h1.words, ratioToBody: bodySize ? round(h1Size / bodySize, 3) : null } : null,
		lineHeight: { body: lineHeightSummary(raw.bodyLineHeights), headings: lineHeightSummary(raw.headingLineHeights) },
		uppercase: raw.uppercase.map((u) => ({
			selector: u.selector,
			box: u.box,
			text: u.text,
			fontSize: u.fontSize,
			letterSpacingEm: round(u.letterSpacingPx / u.fontSize, 3)
		})),
		justified: raw.justified,
		centered: raw.centered.filter((c) => c.lines > 3)
	};
}
