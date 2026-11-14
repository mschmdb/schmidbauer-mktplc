// Design measurements part 2, evaluated inside the page: proximity, similarity, common region, colour.
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

	// ---- proximity (G1) ----
	// Raw gaps in px between rectangles. Ratios and violation lists are derived in lib/proximity.mjs.
	const rectDistance = (a, b) => {
		const dx = Math.max(0, a.left - b.right, b.left - a.right);
		const dy = Math.max(0, a.top - b.bottom, b.top - a.bottom);
		return Math.hypot(dx, dy);
	};
	const inFlow = (e) => visSet.has(e) && !['absolute', 'fixed'].includes(cs(e).position);
	const neighbour = (el, direction) => {
		for (let n = el[direction]; n; n = n[direction]) if (inFlow(n)) return n;
		return null;
	};
	const MAX_HEADINGS_LISTED = 40;
	// Headings h1 to h4: gap to the previous and the next block in flow. null when there is none or the neighbour sits beside it.
	const headings = vis
		.filter((e) => /^H[1-4]$/.test(e.tagName))
		.slice(0, MAX_HEADINGS_LISTED)
		.map((e) => {
			const r = e.getBoundingClientRect();
			const prev = neighbour(e, 'previousElementSibling');
			const next = neighbour(e, 'nextElementSibling');
			const above = prev && prev.getBoundingClientRect().bottom <= r.top + 1 ? Math.round(r.top - prev.getBoundingClientRect().bottom) : null;
			const below = next && next.getBoundingClientRect().top >= r.bottom - 1 ? Math.round(next.getBoundingClientRect().top - r.bottom) : null;
			return { selector: selectorOf(e), box: boxOf(e), tag: e.tagName, text: e.textContent.trim().slice(0, 50), gapAbove: above === null ? null : Math.max(0, above), gapBelow: below === null ? null : Math.max(0, below) };
		});

	// Form labels: gap to their own control against the nearest other control. Labels with a hidden control are skipped.
	const MAX_CONTROLS = 80;
	const MAX_LABELS = 60;
	const controls = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((e) => visSet.has(e)).slice(0, MAX_CONTROLS);
	const labels = [...document.querySelectorAll('label')]
		.filter((l) => visSet.has(l) && l.control && visSet.has(l.control))
		.slice(0, MAX_LABELS)
		.map((l) => {
			const r = l.getBoundingClientRect();
			const own = l.contains(l.control) ? 0 : rectDistance(r, l.control.getBoundingClientRect());
			const others = controls.filter((c) => c !== l.control).map((c) => rectDistance(r, c.getBoundingClientRect()));
			return {
				selector: selectorOf(l),
				box: boxOf(l),
				text: l.textContent.trim().slice(0, 40),
				control: selectorOf(l.control),
				ownGap: Math.round(own),
				otherGap: others.length ? Math.round(Math.min(...others)) : null
			};
		});

	// Groups of 3+ repeated siblings (same tag and class signature). Text-flow elements (paragraphs, headings, labels, fields,
	// inline elements) are not groups: their spacing is typographic. Inner gap = median nearest-neighbour distance between
	// members. Outer gap = smallest distance from the group's bounding box to a non-member sibling or to a sibling of the parent
	// that does not overlap it.
	const MAX_GROUPS = 30;
	const GROUP_MIN_SIZE = 24;
	const FLOW_TAGS = /^(P|H[1-6]|LABEL|INPUT|SELECT|TEXTAREA|BR|HR|SPAN|OPTION)$/;
	const signature = (e) => `${e.tagName.toLowerCase()}${[...e.classList].sort().map((c) => `.${c}`).join('')}`;
	const rectOf = (e) => e.getBoundingClientRect();
	const union = (rects) => ({
		left: Math.min(...rects.map((r) => r.left)),
		top: Math.min(...rects.map((r) => r.top)),
		right: Math.max(...rects.map((r) => r.right)),
		bottom: Math.max(...rects.map((r) => r.bottom))
	});
	const medianOf = (nums) => {
		const sorted = [...nums].sort((x, y) => x - y);
		return sorted[Math.floor(sorted.length / 2)];
	};
	const groups = [];
	for (const parent of [document.body, ...vis]) {
		if (groups.length >= MAX_GROUPS) break;
		const bySignature = new Map();
		for (const child of parent.children) {
			if (!inFlow(child) || FLOW_TAGS.test(child.tagName) || cs(child).display === 'inline') continue;
			const r = rectOf(child);
			if (r.width < GROUP_MIN_SIZE || r.height < GROUP_MIN_SIZE) continue;
			const key = signature(child);
			bySignature.set(key, [...(bySignature.get(key) || []), child]);
		}
		for (const [key, members] of bySignature) {
			if (members.length < 3 || groups.length >= MAX_GROUPS) continue;
			const rects = members.map(rectOf);
			const inner = medianOf(rects.map((r, i) => Math.min(...rects.filter((_, j) => j !== i).map((o) => rectDistance(r, o)))));
			const box = union(rects);
			const memberSet = new Set(members);
			const around = [...parent.children].filter((c) => !memberSet.has(c) && inFlow(c));
			for (const side of ['previousElementSibling', 'nextElementSibling']) {
				const n = parent === document.body ? null : neighbour(parent, side);
				if (n) around.push(n);
			}
			const distances = around.map((c) => rectDistance(box, rectOf(c))).filter((d) => d > 0);
			groups.push({
				selector: selectorOf(parent),
				box: { x: Math.round(box.left + window.scrollX), y: Math.round(box.top + window.scrollY), w: Math.round(box.right - box.left), h: Math.round(box.bottom - box.top) },
				signature: key,
				count: members.length,
				members: members.slice(0, 5).map(selectorOf),
				inner: Math.round(inner),
				outer: distances.length ? Math.round(Math.min(...distances)) : null
			});
		}
	}

	return {
		limits: { total: allElements.length, scanned: scanned.length, capped: allElements.length > MAX_ELEMENTS },
		proximity: { headings, labels, groups }
	};
})();
