// Design measurements part 3, evaluated inside the page: hierarchy, first viewport, prominence candidates, tells.
// Same contract as measure.js: self-contained, no imports, returns one JSON-serialisable object of RAW data.
// Scoring and bucketing happen in lib/*.mjs. See measure-design.js for the shared prelude and the caps
// (MAX_ELEMENTS 3000). Caps of this file are named where they are used (all own values, not conventions).
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
	// Stable CSS selector: #id when unique, else tag:nth-of-type segments up to 5 levels (anchored at <html> when short enough).
	const selectorOf = (el) => {
		const parts = [];
		for (let n = el; n && n.nodeType === 1 && parts.length < 5; n = n.parentElement) {
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
	const isTransparent = (c) => c === 'transparent' || /(,\s*|\/\s*)0(\.0+)?%?\)$/.test(c);
	const bgCache = new WeakMap();
	// Nearest ancestor background that is not transparent; white canvas when none.
	const effectiveBg = (el) => {
		if (!el) return 'rgb(255, 255, 255)';
		if (bgCache.has(el)) return bgCache.get(el);
		const own = cs(el).backgroundColor;
		const result = isTransparent(own) ? effectiveBg(el.parentElement) : own;
		bgCache.set(el, result);
		return result;
	};
	const SIDES = ['Top', 'Right', 'Bottom', 'Left'];
	// A box has a visible edge when a real border, a shadow or a fill that differs from its surroundings draws it.
	const hasVisibleEdge = (el) => {
		const s = cs(el);
		const border = SIDES.some((side) => px(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none' && !isTransparent(s[`border${side}Color`]));
		const fill = !isTransparent(s.backgroundColor) && s.backgroundColor !== effectiveBg(el.parentElement);
		return s.boxShadow !== 'none' || border || fill;
	};
	const label = (e) => (e.getAttribute('aria-label') || e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);

	// ---- first viewport: what a visitor sees before scrolling ----
	const VW = window.innerWidth;
	const VH = window.innerHeight;
	const clip = (r) => ({
		left: Math.max(0, r.left),
		top: Math.max(0, r.top),
		right: Math.min(VW, r.right),
		bottom: Math.min(VH, r.bottom)
	});
	const clippedArea = (r) => {
		const c = clip(r);
		return Math.max(0, c.right - c.left) * Math.max(0, c.bottom - c.top);
	};
	const inFirst = (e) => clippedArea(e.getBoundingClientRect()) > 0;
	const firstVis = vis.filter(inFirst);
	const firstText = textEls.filter(inFirst);
	// Bounding rect of an element's own text nodes only (not its children).
	const textRect = (e) => {
		const range = document.createRange();
		const rects = [];
		for (const n of e.childNodes) {
			if (n.nodeType !== 3 || !n.textContent.trim()) continue;
			range.selectNodeContents(n);
			const r = range.getBoundingClientRect();
			if (r.width > 0 && r.height > 0) rects.push(r);
		}
		if (!rects.length) return e.getBoundingClientRect();
		return {
			left: Math.min(...rects.map((r) => r.left)),
			top: Math.min(...rects.map((r) => r.top)),
			right: Math.max(...rects.map((r) => r.right)),
			bottom: Math.max(...rects.map((r) => r.bottom)),
			get width() { return this.right - this.left; },
			get height() { return this.bottom - this.top; }
		};
	};

	// ---- hierarchy (H1): filled, primary-looking buttons in the first viewport ----
	// Visible, at least 24 px high, with a background of alpha above 0 that differs from the surrounding background.
	const MAX_BUTTONS = 20;
	const MIN_BUTTON_HEIGHT = 24;
	const isFilled = (e) => !isTransparent(cs(e).backgroundColor) && cs(e).backgroundColor !== effectiveBg(e.parentElement);
	const primaryButtons = firstVis
		.filter((e) => e.matches('button, [role=button], input[type=submit], a[href]') && e.getBoundingClientRect().height >= MIN_BUTTON_HEIGHT && isFilled(e))
		.slice(0, MAX_BUTTONS)
		.map((e) => ({ selector: selectorOf(e), box: boxOf(e), label: e.value && e.tagName === 'INPUT' ? e.value : label(e), background: cs(e).backgroundColor, color: cs(e).color }));

	// h1: present in the first viewport, its font size and word count.
	const h1El = [...document.querySelectorAll('h1')].find(visSet.has.bind(visSet));
	const h1 = h1El
		? { present: inFirst(h1El), anywhere: true, selector: selectorOf(h1El), box: boxOf(h1El), fontSize: cs(h1El).fontSize, words: h1El.textContent.trim().split(/\s+/).filter(Boolean).length }
		: { present: false, anywhere: false };

	// Visual weight inputs: area of the visible text and its font size; the largest 60 by area are kept.
	const MAX_WEIGHTS = 60;
	const weights = firstText
		.map((e) => ({ e, area: Math.round(clippedArea(textRect(e))) }))
		.filter((w) => w.area > 0)
		.sort((a, b) => b.area - a.area)
		.slice(0, MAX_WEIGHTS)
		.map(({ e, area }) => ({ selector: selectorOf(e), box: boxOf(e), label: label(e), area, fontSize: px(cs(e).fontSize), fontWeight: cs(e).fontWeight }));

	// Share of the first viewport covered by img, video, canvas and CSS background images (union on an 8 px grid).
	const GRID = 8;
	const MAX_MEDIA = 20;
	const hasBgImage = (e) => /url\(/.test(cs(e).backgroundImage);
	const mediaEls = firstVis.filter((e) => e.matches('img, video, canvas') || hasBgImage(e)).filter((e) => {
		const r = e.getBoundingClientRect();
		return r.width >= 16 && r.height >= 16;
	});
	const cols = Math.ceil(VW / GRID);
	const rows = Math.ceil(VH / GRID);
	const covered = new Uint8Array(cols * rows);
	for (const e of mediaEls) {
		const c = clip(e.getBoundingClientRect());
		for (let y = Math.floor(c.top / GRID); y < Math.min(rows, Math.ceil(c.bottom / GRID)); y++) {
			for (let x = Math.floor(c.left / GRID); x < Math.min(cols, Math.ceil(c.right / GRID)); x++) covered[y * cols + x] = 1;
		}
	}
	const media = {
		coveredShare: Math.round((covered.reduce((sum, v) => sum + v, 0) / (cols * rows)) * 1000) / 1000,
		items: mediaEls.slice(0, MAX_MEDIA).map((e) => ({ kind: e.matches('img, video, canvas') ? e.tagName.toLowerCase() : 'background-image', selector: selectorOf(e), box: boxOf(e) }))
	};

	// Fixed or sticky elements that cover more than 10 percent of the viewport (cookie banner, overlay, big sticky header).
	const OVERLAY_MIN_SHARE = 0.1;
	const overlayEls = [];
	for (const e of firstVis) {
		const position = cs(e).position;
		if (position !== 'fixed' && position !== 'sticky') continue;
		const share = clippedArea(e.getBoundingClientRect()) / (VW * VH);
		if (share > OVERLAY_MIN_SHARE && !overlayEls.some((o) => o.el.contains(e))) overlayEls.push({ el: e, position, share });
	}
	const overlays = overlayEls.map(({ el, position, share }) => ({ selector: selectorOf(el), box: boxOf(el), position, areaShare: Math.round(share * 1000) / 1000 }));

	// Text over an image: an ancestor paints a background image, or at least half of the text box overlaps a media element.
	const MAX_TEXT_OVER = 20;
	const mediaRects = firstVis.filter((e) => e.matches('img, video, canvas, picture')).map((e) => ({ e, r: e.getBoundingClientRect() }));
	const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
	const textOverImage = [];
	for (const e of firstText) {
		if (textOverImage.length >= MAX_TEXT_OVER) break;
		let via = null;
		for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
			if (hasBgImage(n)) {
				via = 'background-image';
				break;
			}
		}
		if (!via) {
			const t = textRect(e);
			const area = t.width * t.height;
			if (area > 0 && mediaRects.some(({ e: m, r }) => !m.contains(e) && overlap(t, r) / area >= 0.5)) via = 'overlap';
		}
		if (via) textOverImage.push({ selector: selectorOf(e), box: boxOf(e), label: label(e), via });
	}

	// ---- prominence candidates (H2): raw inputs; lib/prominence.mjs scores them (a prediction, not eye tracking) ----
	// Candidates: text elements and buttons in the first viewport, and img, video and canvas of at least 48 x 48 px.
	// The 60 largest by visible area are kept (MAX_CANDIDATES).
	const MAX_CANDIDATES = 60;
	const MIN_MEDIA = 48;
	const candidateOf = (e, kind, r) => {
		const s = cs(e);
		const c = clip(r);
		return {
			selector: selectorOf(e),
			box: boxOf(e),
			label: kind === 'media' ? `${e.tagName.toLowerCase()} ${e.getAttribute('alt') || ''}`.trim() : label(e),
			kind,
			area: Math.round(clippedArea(r)),
			color: s.color,
			background: effectiveBg(e),
			surround: effectiveBg(e.parentElement),
			fontSize: px(s.fontSize),
			fontWeight: s.fontWeight,
			cx: Math.round((c.left + c.right) / 2),
			cy: Math.round((c.top + c.bottom) / 2)
		};
	};
	const isButton = (e) => e.matches('button, [role=button], input[type=submit], a[href]') && isFilled(e);
	const prominenceCandidates = [
		...firstText.map((e) => candidateOf(e, isButton(e) ? 'button' : 'text', textRect(e))),
		...firstVis.filter((e) => e.matches('img, video, canvas') && e.getBoundingClientRect().width >= MIN_MEDIA && e.getBoundingClientRect().height >= MIN_MEDIA).map((e) => candidateOf(e, 'media', e.getBoundingClientRect()))
	]
		.filter((c) => c.area > 0)
		.sort((a, b) => b.area - a.area)
		.slice(0, MAX_CANDIDATES);

	return {
		limits: { total: allElements.length, scanned: scanned.length, capped: allElements.length > MAX_ELEMENTS },
		hierarchy: { primaryButtons },
		firstViewport: { width: VW, height: VH, h1, weights, media, overlays, textOverImage },
		prominence: { candidates: prominenceCandidates }
	};
})();
