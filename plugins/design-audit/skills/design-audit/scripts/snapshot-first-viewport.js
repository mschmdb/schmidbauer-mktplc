// Light snapshot, evaluated inside the page about 1000 ms after navigation (see audit.mjs).
// Returns the selectors of text elements and loaded media that are visible in the first viewport right now.
// lib/late-content.mjs diffs it against the final measurement of measure-design-view.js.
// Self-contained, no imports. The visibility test and selectorOf match measure-design-view.js.
(() => {
	const MAX_ELEMENTS = 3000;
	const MAX_VISIBLE = 300;
	const MAX_VISIBLE_MEDIA = 100;
	const MIN_MEDIA_SIDE = 16; // smaller images are icons
	const MIN_SVG_SIDE = 48; // an inline svg of this size counts as an illustration
	const NOT_RENDERED = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
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
	const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
	const inFirst = (el) => {
		const r = el.getBoundingClientRect();
		const vw = window.__auditViewport?.width ?? document.documentElement.clientWidth;
		const vh = window.__auditViewport?.height ?? window.innerHeight;
		return Math.min(vw, r.right) > Math.max(0, r.left) && Math.min(vh, r.bottom) > Math.max(0, r.top);
	};
	const all = [...document.body.querySelectorAll('*')];
	const scanned = all.slice(0, MAX_ELEMENTS).filter((e) => !NOT_RENDERED.has(e.tagName) && !e.ownerSVGElement);
	const shown = scanned.filter((e) => !e.closest('[aria-hidden="true"]') && hasOwnText(e) && visible(e) && inFirst(e));
	// Media that is painted: a loaded image, a video with a frame, a canvas, a large inline svg, a background image.
	// The same test sits in measure-design-view.js.
	const side = (el) => {
		const r = el.getBoundingClientRect();
		return Math.min(r.width, r.height);
	};
	const isMedia = (el) => {
		if (el instanceof HTMLImageElement) return el.complete && el.naturalWidth > 0 && side(el) >= MIN_MEDIA_SIDE;
		if (el instanceof HTMLVideoElement) return el.readyState >= 2 && side(el) >= MIN_MEDIA_SIDE;
		if (el instanceof HTMLCanvasElement) return side(el) >= MIN_MEDIA_SIDE;
		if (el instanceof SVGSVGElement) return side(el) >= MIN_SVG_SIDE;
		return /url\(/.test(getComputedStyle(el).backgroundImage) && side(el) >= MIN_MEDIA_SIDE;
	};
	const media = all.slice(0, MAX_ELEMENTS).filter((e) => !NOT_RENDERED.has(e.tagName) && !e.ownerSVGElement && visible(e) && inFirst(e) && isMedia(e));
	return {
		visible: shown.slice(0, MAX_VISIBLE).map(selectorOf),
		visibleMedia: media.slice(0, MAX_VISIBLE_MEDIA).map(selectorOf),
		capped: shown.length > MAX_VISIBLE || media.length > MAX_VISIBLE_MEDIA || all.length > MAX_ELEMENTS
	};
})();
