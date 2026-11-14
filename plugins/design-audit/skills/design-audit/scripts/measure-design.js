// Design measurements part 1, evaluated inside the page: typography, spacing, alignment.
// Same contract as measure.js: self-contained, no imports, returns one JSON-serialisable object of RAW data.
// Scoring and bucketing happen in lib/*.mjs. audit.mjs runs this file together with measure-design-gestalt.js
// and measure-design-view.js and merges the three results (see design-scripts.mjs).
//
// Caps (own values, not conventions):
//   MAX_ELEMENTS 3000   first elements of <body> in document order that are inspected; `limits.capped` tells when it bit.
//   MAX_LISTED_TYPE 30, MAX_PARAGRAPHS 15, MAX_HEADINGS 20, MAX_SECTIONS 30, MAX_SIDE_MARGINS 60, MAX_EDGES 200:
//   caps on the reported example lists (each entry carries a selector and a bounding box).
//   SPACING_MAX_PX 160   larger margins, paddings and gaps are not counted: they are mostly `margin: auto` centring.
// getComputedStyle runs once per element: `cs` caches the style object.
(() => {
	// ---- shared prelude (the same block sits in every measure-design*.js; each file must stay self-contained) ----
	const MAX_ELEMENTS = 3000;
	const styleCache = new WeakMap();
	const cs = (el) => {
		let style = styleCache.get(el);
		if (!style) {
			style = getComputedStyle(el);
			styleCache.set(el, style);
		}
		return style;
	};
	const docWidth = document.documentElement.scrollWidth;
	const docHeight = document.documentElement.scrollHeight;
	const visible = (el) => {
		if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false;
		const r = el.getBoundingClientRect();
		if (r.width <= 1 && r.height <= 1) return false;
		const left = r.left + window.scrollX;
		const top = r.top + window.scrollY;
		return r.width > 0 && r.height > 0 && left + r.width > 0 && top + r.height > 0 && left < docWidth && top < docHeight;
	};
	const boxOf = (el) => {
		const r = el.getBoundingClientRect();
		return { x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
	};
	// Stable CSS selector that resolves to exactly this element: #id when unique, else tag:nth-of-type segments.
	// Tries 5 levels first (short); when that matches more than one element, it uses the full path up to <html>.
	const pathOf = (el, maxDepth) => {
		const parts = [];
		for (let n = el; n && n.nodeType === 1 && parts.length < maxDepth; n = n.parentElement) {
			if (n.id && document.querySelectorAll(`#${CSS.escape(n.id)}`).length === 1) {
				parts.unshift(`#${CSS.escape(n.id)}`);
				break;
			}
			const tag = n.tagName.toLowerCase();
			if (n === document.documentElement) {
				parts.unshift(tag);
				break;
			}
			const same = [...n.parentElement.children].filter((c) => c.tagName === n.tagName);
			parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(n) + 1})` : tag);
		}
		return parts.join(' > ');
	};
	const selectorOf = (el) => {
		const short = pathOf(el, 5);
		return document.querySelectorAll(short).length === 1 ? short : pathOf(el, Infinity);
	};
	const NOT_RENDERED = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
	const allElements = [...document.body.querySelectorAll('*')];
	const scanned = allElements.slice(0, MAX_ELEMENTS).filter((e) => !NOT_RENDERED.has(e.tagName) && !e.ownerSVGElement);
	const vis = scanned.filter(visible);
	const visSet = new Set(vis);
	const ownText = (el) =>
		[...el.childNodes]
			.filter((n) => n.nodeType === 3)
			.map((n) => n.textContent)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();
	const textEls = vis.filter((e) => !e.closest('[aria-hidden="true"]') && ownText(e));
	const contentRoot = document.querySelector('main, [role=main]') || document.body;
	const isChrome = (e) => !!e.closest('nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo]');
	const inContent = (e) => contentRoot.contains(e) && !isChrome(e);
	const add = (map, key, n) => {
		map[key] = (map[key] || 0) + n;
	};
	// ---- end of shared prelude ----

	const px = (value) => parseFloat(value);
	const CODE = 'code, pre, kbd, samp, tt';
	const MAX_LISTED_TYPE = 30; // uppercase, justified, centred: examples per list
	const MAX_PARAGRAPHS = 15; // body paragraphs sampled for line height
	const MAX_HEADINGS = 20;

	// ---- typography (T1, T2, T4, T5, T6, T7) ----
	// Usage counts are text lengths (characters of own text nodes), not element counts.
	const families = {};
	const weights = {};
	const sizes = {};
	const mainSizes = {};
	for (const e of textEls) {
		const s = cs(e);
		const chars = ownText(e).length;
		const family = s.fontFamily.split(',')[0].trim();
		const inCode = !!e.closest(CODE);
		families[family] = families[family] || { text: 0, code: 0 };
		families[family][inCode ? 'code' : 'text'] += chars;
		if (inCode) continue;
		add(weights, s.fontWeight, chars);
		add(sizes, s.fontSize, chars);
		if (inContent(e)) add(mainSizes, s.fontSize, chars);
	}

	const firstH1 = [...document.querySelectorAll('h1')].find(visible);
	const h1 = firstH1
		? { selector: selectorOf(firstH1), box: boxOf(firstH1), fontSize: cs(firstH1).fontSize, words: firstH1.textContent.trim().split(/\s+/).filter(Boolean).length }
		: null;

	const lineHeightPx = (e) => {
		const lh = cs(e).lineHeight;
		return lh === 'normal' ? null : px(lh);
	};
	// Visible lines from the box height: (height - vertical padding) / line height; `normal` counts as 1.2 em.
	const lineCount = (e) => {
		const s = cs(e);
		const lh = lineHeightPx(e) || px(s.fontSize) * 1.2;
		const inner = e.getBoundingClientRect().height - px(s.paddingTop) - px(s.paddingBottom) - px(s.borderTopWidth) - px(s.borderBottomWidth);
		return Math.max(1, Math.round(inner / lh));
	};
	const bodyLineHeights = [...contentRoot.querySelectorAll('p, li')]
		.filter((e) => visSet.has(e) && !isChrome(e) && e.textContent.trim().length > 80)
		.slice(0, MAX_PARAGRAPHS)
		.map((e) => ({ selector: selectorOf(e), box: boxOf(e), fontSize: px(cs(e).fontSize), lineHeightPx: lineHeightPx(e) }));
	const headingLineHeights = vis
		.filter((e) => /^H[1-4]$/.test(e.tagName))
		.slice(0, MAX_HEADINGS)
		.map((e) => ({ selector: selectorOf(e), box: boxOf(e), tag: e.tagName, fontSize: px(cs(e).fontSize), lineHeightPx: lineHeightPx(e) }));

	// Uppercase: CSS text-transform, or typed in capitals (3+ letters, no lowercase).
	const typedCaps = (text) => /[A-Z]{3,}/.test(text) && text === text.toUpperCase();
	const uppercase = textEls
		.filter((e) => cs(e).textTransform === 'uppercase' || typedCaps(ownText(e)))
		.slice(0, MAX_LISTED_TYPE)
		.map((e) => {
			const s = cs(e);
			return { selector: selectorOf(e), box: boxOf(e), text: ownText(e).slice(0, 40), fontSize: px(s.fontSize), letterSpacingPx: s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing) };
		});
	const longText = (e) => ownText(e).length >= 80;
	const justified = textEls
		.filter((e) => cs(e).textAlign === 'justify' && longText(e))
		.slice(0, MAX_LISTED_TYPE)
		.map((e) => ({ selector: selectorOf(e), box: boxOf(e), hyphens: cs(e).hyphens, lines: lineCount(e) }));
	const centered = textEls
		.filter((e) => cs(e).textAlign === 'center' && longText(e))
		.slice(0, MAX_LISTED_TYPE)
		.map((e) => ({ selector: selectorOf(e), box: boxOf(e), lines: lineCount(e) }));

	// ---- spacing (S1, S2, S3) ----
	// Histogram of all non-zero margin, padding and gap values of visible elements, rounded to 1 px (absolute value).
	const SPACING_MAX_PX = 160;
	const SPACING_PROPS = [
		'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
		'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
		'rowGap', 'columnGap'
	];
	const histogram = {};
	for (const e of vis) {
		const s = cs(e);
		for (const prop of SPACING_PROPS) {
			const value = Math.abs(Math.round(px(s[prop])));
			if (value > 0 && value <= SPACING_MAX_PX) add(histogram, value, 1); // `normal` gap parses to NaN and is skipped
		}
	}

	// Top-level sections in document order: children of <body>, with <main> replaced by its children.
	// A lone wrapper (a framework root) is opened one level.
	const MAX_SECTIONS = 30;
	const expand = (parent) => [...parent.children].flatMap((c) => (c.tagName === 'MAIN' ? [...c.children] : [c]));
	let top = expand(document.body).filter((e) => visSet.has(e));
	if (top.length === 1 && top[0].children.length > 1) top = expand(top[0]).filter((e) => visSet.has(e));
	const sections = top
		.filter((e) => e.getBoundingClientRect().height >= 40)
		.slice(0, MAX_SECTIONS)
		.map((e) => ({ selector: selectorOf(e), box: boxOf(e), tag: e.tagName, paddingTop: Math.round(px(cs(e).paddingTop)), paddingBottom: Math.round(px(cs(e).paddingBottom)) }));

	// Text blocks of the content: running text and headings (own text, not chrome).
	const TEXT_BLOCK = /^(P|LI|H[1-6]|BLOCKQUOTE|FIGCAPTION|DT|DD)$/;
	const textBlocks = textEls.filter((e) => TEXT_BLOCK.test(e.tagName) && inContent(e));
	// Distance of the text itself (inside padding and border) to the viewport edges.
	const MAX_SIDE_MARGINS = 60;
	const innerLeft = (e) => e.getBoundingClientRect().left + px(cs(e).paddingLeft) + px(cs(e).borderLeftWidth);
	const sideMargins = textBlocks.slice(0, MAX_SIDE_MARGINS).map((e) => {
		const r = e.getBoundingClientRect();
		const s = cs(e);
		return {
			selector: selectorOf(e),
			box: boxOf(e),
			left: Math.round(innerLeft(e)),
			right: Math.round((window.__auditViewport?.width ?? document.documentElement.clientWidth) - (r.right - px(s.paddingRight) - px(s.borderRightWidth)))
		};
	});

	// ---- alignment (G5): left edges of text blocks in the content ----
	const MAX_EDGES = 200;
	const edges = textBlocks.slice(0, MAX_EDGES).map((e) => ({ x: Math.round(innerLeft(e) + window.scrollX), selector: selectorOf(e), box: boxOf(e) }));

	return {
		limits: { total: allElements.length, scanned: scanned.length, capped: allElements.length > MAX_ELEMENTS },
		typography: { families, weights, sizes, mainSizes, h1, bodyLineHeights, headingLineHeights, uppercase, justified, centered },
		spacing: { histogram, sections, sideMargins },
		alignment: { edges }
	};
})();
