#!/usr/bin/env node
// WCAG 2.x contrast for color pairs, with alpha compositing.
// Accepts hex, rgb()/rgba(), oklch(), oklab(). oklch/oklab are mapped to sRGB and clamped.
// Usage: node contrast.mjs [--base <color>] <foreground> <background> [<fg> <bg> ...]
// A translucent background is composited over --base (default white),
// then a translucent foreground over that result.
import { pathToFileURL } from 'node:url';

const NAMED = {
	white: { r: 255, g: 255, b: 255, a: 1 },
	black: { r: 0, g: 0, b: 0, a: 1 },
	transparent: { r: 0, g: 0, b: 0, a: 0 }
};

function unsupported(value) {
	return new Error(`Unsupported color "${value}". Use hex, rgb()/rgba(), oklch(), oklab(), white, black or transparent.`);
}

const alphaOf = (p) => (p === undefined ? 1 : p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p));

// OKLab to gamma-encoded sRGB (0-255), clamped to the sRGB gamut.
function oklabToRgb(L, a, b) {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const linear = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
	const encode = (c) => {
		const v = Math.min(1, Math.max(0, c));
		return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
	};
	const [r, g, bl] = linear.map(encode);
	return { r, g, b: bl };
}

export function parseColor(input) {
	const value = input.trim().toLowerCase();
	if (NAMED[value]) return { ...NAMED[value] };

	const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
	if (hex) {
		let digits = hex[1];
		if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('');
		const byte = (i) => parseInt(digits.slice(i, i + 2), 16);
		return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 };
	}

	const fn = value.match(/^rgba?\(([^)]*)\)$/);
	if (fn) {
		const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
		if (parts.length !== 3 && parts.length !== 4) throw unsupported(input);
		const channel = (p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p));
		const color = {
			r: channel(parts[0]),
			g: channel(parts[1]),
			b: channel(parts[2]),
			a: alphaOf(parts[3])
		};
		if (Object.values(color).some(Number.isNaN)) throw unsupported(input);
		return color;
	}

	const ok = value.match(/^(oklch|oklab)\(([^)]*)\)$/);
	if (ok) {
		const parts = ok[2].split(/[\s,/]+/).filter(Boolean);
		if (parts.length !== 3 && parts.length !== 4) throw unsupported(input);
		const L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
		let a, b;
		if (ok[1] === 'oklch') {
			const chroma = parseFloat(parts[1]);
			const hue = (parseFloat(parts[2]) * Math.PI) / 180;
			[a, b] = [chroma * Math.cos(hue), chroma * Math.sin(hue)];
		} else {
			[a, b] = [parseFloat(parts[1]), parseFloat(parts[2])];
		}
		const color = { ...oklabToRgb(L, a, b), a: alphaOf(parts[3]) };
		if (Object.values(color).some(Number.isNaN)) throw unsupported(input);
		return color;
	}

	throw unsupported(input);
}

// Source-over compositing of `top` onto an opaque `bottom`.
export function composite(top, bottom) {
	const mix = (t, b) => t * top.a + b * (1 - top.a);
	return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

function luminance({ r, g, b }) {
	const linear = (c) => {
		const s = c / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a, b) {
	const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
}

export function pairRatio(fg, bg, base = 'white') {
	const ground = composite(parseColor(bg), composite(parseColor(base), NAMED.white));
	return contrastRatio(composite(parseColor(fg), ground), ground);
}

export function verdict(ratio) {
	if (ratio >= 7) return 'AAA text';
	if (ratio >= 4.5) return 'AA text';
	if (ratio >= 3) return 'large text / UI only';
	return 'fails';
}

function main(argv) {
	const args = [...argv];
	let base = 'white';
	const flag = args.indexOf('--base');
	if (flag !== -1) {
		base = args[flag + 1];
		args.splice(flag, 2);
	}
	if (!base || args.length < 2 || args.length % 2) {
		console.error('Usage: node contrast.mjs [--base <color>] <foreground> <background> [<fg> <bg> ...]');
		process.exit(2);
	}
	for (let i = 0; i < args.length; i += 2) {
		const [fg, bg] = [args[i], args[i + 1]];
		try {
			const ratio = pairRatio(fg, bg, base);
			console.log(`${fg} on ${bg}: ${ratio.toFixed(2)}:1 (${verdict(ratio)})`);
		} catch (error) {
			console.error(`${fg} on ${bg}: ${error.message}`);
			process.exitCode = 1;
		}
	}
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
