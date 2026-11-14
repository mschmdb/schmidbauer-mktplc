// Decide from computed styles whether keyboard focus is visible.
// Pure function: audit code collects the style snapshots, this file judges them.
import { parseColor } from '../contrast.mjs';

/**
 * @typedef {Object} StyleSnapshot
 * @property {string} outlineStyle
 * @property {string} outlineWidth
 * @property {string} outlineColor
 * @property {string} boxShadow
 * @property {string} borderColor
 * @property {string} backgroundColor
 * @property {string} color
 * @property {string} textDecorationLine
 */

/**
 * @typedef {Object} FocusIndicator
 * @property {boolean} visible
 * @property {'outline'|'box-shadow'|'border'|'background'|'color'|'underline'|'none'} via
 */

/**
 * True unless the colour parses and is fully transparent.
 * Unknown colour formats count as opaque so a real ring is not reported as missing.
 * @param {string} color computed CSS colour
 * @returns {boolean}
 */
function hasAlpha(color) {
	try {
		return parseColor(color).a > 0;
	} catch {
		return true;
	}
}

/**
 * @param {StyleSnapshot} s
 * @returns {boolean}
 */
function drawsOutline(s) {
	return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && hasAlpha(s.outlineColor);
}

/**
 * Compare focused and unfocused styles of one element.
 * Tailwind `outline-none` computes to a transparent outline, so the colour alpha decides, not the style.
 * @param {StyleSnapshot} focused
 * @param {StyleSnapshot} unfocused
 * @returns {FocusIndicator}
 */
export function focusIndicator(focused, unfocused) {
	if (drawsOutline(focused) && !(drawsOutline(unfocused) && focused.outlineColor === unfocused.outlineColor && focused.outlineWidth === unfocused.outlineWidth)) {
		return { visible: true, via: 'outline' };
	}
	if (focused.boxShadow !== 'none' && focused.boxShadow !== unfocused.boxShadow) return { visible: true, via: 'box-shadow' };
	if (focused.borderColor !== unfocused.borderColor) return { visible: true, via: 'border' };
	if (focused.backgroundColor !== unfocused.backgroundColor) return { visible: true, via: 'background' };
	if (focused.color !== unfocused.color) return { visible: true, via: 'color' };
	if (focused.textDecorationLine !== unfocused.textDecorationLine) return { visible: true, via: 'underline' };
	return { visible: false, via: 'none' };
}
