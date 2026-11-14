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

	// ---- edge detection shared by similarity and common region ----
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

	// ---- button test (H1, G2) ----
	// The same block sits in measure-design-gestalt.js and measure-design-view.js; each file must stay self-contained.
	// A filled button has a text label, a solid fill that differs from what is behind it, and a minimum size. Image links,
	// glass controls (map zoom), icon-only buttons and on/off toggles are not filled buttons.
	const BUTTON_MIN_ALPHA = 0.9; // own value: a fill more see-through than this is a glass control
	const BUTTON_MIN_DISTANCE = 30; // own value: RGB distance between the fill and the colour behind it
	const BUTTON_MIN_WIDTH = 48; // own value, px
	const BUTTON_MIN_HEIGHT = 24; // own value, px (the WCAG 2.5.8 minimum)
	const IMAGE_LINK_SHARE = 0.5; // own value: media covering this share of the box makes it an image link
	const alphaOf = (c) => {
		const slash = c.match(/\/\s*([\d.]+)(%?)\s*\)$/);
		if (slash) return parseFloat(slash[1]) / (slash[2] ? 100 : 1);
		const rgba = c.match(/^rgba\(([^)]+)\)/);
		return rgba && rgba[1].split(',').length === 4 ? parseFloat(rgba[1].split(',')[3]) : 1;
	};
	const rgbOf = (c) => {
		const m = c.match(/^rgba?\(([^)]+)\)/);
		return m ? m[1].split(/[\s,/]+/).slice(0, 3).map(parseFloat) : null;
	};
	const hasLabelText = (e) => /[\p{L}\p{N}]/u.test((e.tagName === 'INPUT' ? e.value : e.innerText) || '');
	const isToggle = (e) => e.hasAttribute('aria-pressed') || e.getAttribute('role') === 'switch';
	const isImageLink = (e) => {
		const r = e.getBoundingClientRect();
		const media = [...e.querySelectorAll('img, picture, video, canvas, svg')].reduce((sum, m) => sum + m.getBoundingClientRect().width * m.getBoundingClientRect().height, 0);
		return r.width * r.height > 0 && media / (r.width * r.height) >= IMAGE_LINK_SHARE;
	};
	const hasSolidFill = (e) => {
		const bg = cs(e).backgroundColor;
		if (isTransparent(bg) || alphaOf(bg) < BUTTON_MIN_ALPHA) return false;
		const behind = effectiveBg(e.parentElement);
		const a = rgbOf(bg);
		const b = rgbOf(behind);
		return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) >= BUTTON_MIN_DISTANCE : bg !== behind;
	};
	const sizedLikeButton = (e) => {
		const r = e.getBoundingClientRect();
		return r.width >= BUTTON_MIN_WIDTH && r.height >= BUTTON_MIN_HEIGHT;
	};
	const isFilledButton = (e) =>
		e.matches('button, [role=button], input[type=submit], a[href]') && sizedLikeButton(e) && hasLabelText(e) && !isToggle(e) && !isImageLink(e) && hasSolidFill(e);

	// ---- content boxes (G1) ----
	// Proximity compares what a reader sees: text lines, media and controls. The padding box of a wrapper is not a content box.
	// A box that draws its own edge (border, shadow, fill) counts with that edge, unless it spans the full page width (a band).
	const MEDIA_SELECTOR = 'img, video, canvas, picture, svg, iframe';
	const CONTROL_SELECTOR = 'button, input:not([type=hidden]), select, textarea';
	const MIN_MEDIA_SIDE = 16; // smaller media are icons, not content boxes
	const rectDistance = (a, b) => {
		const dx = Math.max(0, a.left - b.right, b.left - a.right);
		const dy = Math.max(0, a.top - b.bottom, b.top - a.bottom);
		return Math.hypot(dx, dy);
	};
	const union = (rects) => ({
		left: Math.min(...rects.map((r) => r.left)),
		top: Math.min(...rects.map((r) => r.top)),
		right: Math.max(...rects.map((r) => r.right)),
		bottom: Math.max(...rects.map((r) => r.bottom))
	});
	const lineHeightOf = (style) => (style.lineHeight === 'normal' ? px(style.fontSize) * 1.2 : px(style.lineHeight));
	const blockOfElement = (el) => {
		let block = el;
		while (block.parentElement && cs(block).display.startsWith('inline')) block = block.parentElement;
		return block;
	};
	// A text rect covers the glyph area; the reader sees the line box. Grow it by the half-leading, then snap an edge that lies
	// within half a line of its block's content edge onto it (font metrics round to whole pixels).
	const lineBox = (r, style, element) => {
		const lh = lineHeightOf(style);
		const pad = Math.max(0, (lh - r.height) / 2);
		const block = blockOfElement(element);
		const br = block.getBoundingClientRect();
		const bs = cs(block);
		const contentTop = br.top + px(bs.paddingTop) + px(bs.borderTopWidth);
		const contentBottom = br.bottom - px(bs.paddingBottom) - px(bs.borderBottomWidth);
		let top = r.top - pad;
		let bottom = r.bottom + pad;
		if (Math.abs(top - contentTop) <= lh / 2) top = contentTop;
		if (Math.abs(bottom - contentBottom) <= lh / 2) bottom = contentBottom;
		return { left: r.left, right: r.right, top, bottom };
	};
	const shown = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) || cs(el).display === 'contents';
	const contentCache = new WeakMap();
	// Union of the text lines, media and controls inside an element, or null when it holds none (a rule, a spacer, a wrapper).
	const contentRect = (root) => {
		if (contentCache.has(root)) return contentCache.get(root);
		const rects = [];
		const walk = (node) => {
			if (node.nodeType === 3) {
				if (!node.data.trim() || !node.parentElement) return;
				const range = document.createRange();
				range.selectNodeContents(node);
				const style = cs(node.parentElement);
				for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) rects.push(lineBox(r, style, node.parentElement));
				return;
			}
			if (node.nodeType !== 1 || NOT_RENDERED.has(node.tagName) || !shown(node)) return;
			if (node.matches(`${MEDIA_SELECTOR}, ${CONTROL_SELECTOR}`)) {
				const r = node.getBoundingClientRect();
				if (r.width >= MIN_MEDIA_SIDE && r.height >= MIN_MEDIA_SIDE) rects.push(r);
				return;
			}
			for (const child of node.childNodes) walk(child);
		};
		walk(root);
		const result = rects.length ? union(rects) : null;
		contentCache.set(root, result);
		return result;
	};
	const BOX_MIN_SIDE = 24; // an empty box smaller than this is a rule or a dot, not a tile
	const visualRect = (el) => {
		const r = el.getBoundingClientRect();
		const content = contentRect(el);
		const boxed = hasVisibleEdge(el) && r.width < 0.95 * (window.__auditViewport?.width ?? document.documentElement.clientWidth);
		return boxed && (content || (r.width >= BOX_MIN_SIDE && r.height >= BOX_MIN_SIDE)) ? r : content;
	};
	const inFlow = (e) => visSet.has(e) && !['absolute', 'fixed'].includes(cs(e).position);
	// Nearest sibling in flow that has content; rules and spacers are skipped.
	const neighbour = (el, direction) => {
		for (let n = el[direction]; n; n = n[direction]) if (inFlow(n) && visualRect(n)) return n;
		return null;
	};
	const MAX_HEADINGS_LISTED = 40;
	const KICKER_MAX_CHARS = 60; // own value: a label, not a sentence
	const KICKER_MAX_LINES = 2; // own value
	// A kicker (eyebrow, byline, date line) is a short block directly above a heading that is smaller than it or set in capitals,
	// and sits closer to the heading than to whatever is above it. Then it belongs to the heading.
	const kickerOf = (heading, headingRect) => {
		const k = neighbour(heading, 'previousElementSibling');
		if (!k) return null;
		const rect = visualRect(k);
		const text = k.textContent.replace(/\s+/g, ' ').trim();
		if (rect.bottom > headingRect.top + 1 || !text || text.length > KICKER_MAX_CHARS) return null;
		const textStyle = cs([k, ...k.querySelectorAll('*')].find((e) => ownText(e)) || k);
		const content = contentRect(k);
		if ((content.bottom - content.top) / lineHeightOf(textStyle) > KICKER_MAX_LINES + 0.25) return null;
		const smaller = px(textStyle.fontSize) < px(cs(heading).fontSize);
		if (!smaller && textStyle.textTransform !== 'uppercase') return null;
		const before = neighbour(k, 'previousElementSibling');
		const beforeRect = before && visualRect(before);
		const gapBefore = beforeRect && beforeRect.bottom <= rect.top + 1 ? rect.top - beforeRect.bottom : Infinity;
		return headingRect.top - rect.bottom < gapBefore ? { element: k, rect, text: text.slice(0, 50) } : null;
	};
	// Headings h1 to h4: gap to the previous and the next content block in flow. A kicker counts as part of the heading.
	// null when there is none or the neighbour sits beside it.
	const headings = vis
		.filter((e) => /^H[1-4]$/.test(e.tagName))
		.slice(0, MAX_HEADINGS_LISTED)
		.map((e) => {
			const r = visualRect(e) || e.getBoundingClientRect();
			const kicker = kickerOf(e, r);
			const top = kicker ? Math.min(kicker.rect.top, r.top) : r.top;
			const prev = neighbour(kicker ? kicker.element : e, 'previousElementSibling');
			const next = neighbour(e, 'nextElementSibling');
			const prevRect = prev && visualRect(prev);
			const nextRect = next && visualRect(next);
			const above = prevRect && prevRect.bottom <= top + 1 ? Math.round(top - prevRect.bottom) : null;
			const below = nextRect && nextRect.top >= r.bottom - 1 ? Math.round(nextRect.top - r.bottom) : null;
			return {
				selector: selectorOf(e),
				box: boxOf(e),
				tag: e.tagName,
				text: e.textContent.trim().slice(0, 50),
				kicker: kicker ? { selector: selectorOf(kicker.element), text: kicker.text, gap: Math.round(r.top - kicker.rect.bottom) } : null,
				gapAbove: above === null ? null : Math.max(0, above),
				gapBelow: below === null ? null : Math.max(0, below)
			};
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

	// Sibling groups: repeated siblings (same tag and class signature) that read as a set, meaning at least two rows,
	// or three items in one row. Text-flow elements (paragraphs, headings, labels, fields, inline elements) are not groups:
	// their spacing is typographic. Page sections without an edge of their own are page rhythm, not a group.
	// Inner gap = median nearest-neighbour distance between the members' visual boxes. Outer gap = smallest distance from
	// the group's box to a non-member block above or below it (a neighbour beside it belongs to the same row).
	const MAX_GROUPS = 30;
	const GROUP_MIN_SIZE = 24;
	const FLOW_TAGS = /^(P|H[1-6]|LABEL|INPUT|SELECT|TEXTAREA|BR|HR|SPAN|OPTION)$/;
	const PAGE_SECTION_TAGS = /^(SECTION|HEADER|FOOTER|MAIN|NAV|ASIDE)$/;
	const signature = (e) => `${e.tagName.toLowerCase()}${[...e.classList].sort().map((c) => `.${c}`).join('')}`;
	const medianOf = (nums) => {
		const sorted = [...nums].sort((x, y) => x - y);
		return sorted[Math.floor(sorted.length / 2)];
	};
	// Members on the same row overlap vertically by more than half of the smaller one.
	const countRows = (rects) => {
		const rows = [];
		for (const r of [...rects].sort((a, b) => a.top - b.top)) {
			const row = rows.find((o) => Math.min(o.bottom, r.bottom) - Math.max(o.top, r.top) > 0.5 * Math.min(o.bottom - o.top, r.bottom - r.top));
			if (row) {
				row.top = Math.min(row.top, r.top);
				row.bottom = Math.max(row.bottom, r.bottom);
			} else rows.push({ top: r.top, bottom: r.bottom });
		}
		return rows.length;
	};
	const groups = [];
	for (const parent of [document.body, ...vis]) {
		if (groups.length >= MAX_GROUPS) break;
		const bySignature = new Map();
		for (const child of parent.children) {
			if (!inFlow(child) || FLOW_TAGS.test(child.tagName) || cs(child).display === 'inline') continue;
			if (PAGE_SECTION_TAGS.test(child.tagName) && !hasVisibleEdge(child)) continue;
			const r = visualRect(child);
			if (!r || r.right - r.left < GROUP_MIN_SIZE || r.bottom - r.top < GROUP_MIN_SIZE) continue;
			const key = signature(child);
			bySignature.set(key, [...(bySignature.get(key) || []), child]);
		}
		for (const [key, members] of bySignature) {
			if (members.length < 2 || groups.length >= MAX_GROUPS) continue;
			const rects = members.map(visualRect);
			const rows = countRows(rects);
			if (rows < 2 && members.length < 3) continue;
			const inner = medianOf(rects.map((r, i) => Math.min(...rects.filter((_, j) => j !== i).map((o) => rectDistance(r, o)))));
			const box = union(rects);
			const memberSet = new Set(members);
			const around = [...parent.children].filter((c) => !memberSet.has(c) && inFlow(c));
			for (const side of ['previousElementSibling', 'nextElementSibling']) {
				const n = parent === document.body ? null : neighbour(parent, side);
				if (n) around.push(n);
			}
			const distances = around
				.map(visualRect)
				.filter((r) => r && (r.bottom <= box.top + 1 || r.top >= box.bottom - 1))
				.map((r) => rectDistance(box, r))
				.filter((d) => d > 0);
			// The selector names the member at the top left of the group box; `parent` names the container.
			const anchor = members.reduce((a, b) => (visualRect(b).left + visualRect(b).top < visualRect(a).left + visualRect(a).top ? b : a));
			groups.push({
				selector: selectorOf(anchor),
				parent: selectorOf(parent),
				box: { x: Math.round(box.left + window.scrollX), y: Math.round(box.top + window.scrollY), w: Math.round(box.right - box.left), h: Math.round(box.bottom - box.top) },
				signature: key,
				count: members.length,
				rows,
				members: members.slice(0, 5).map(selectorOf),
				inner: Math.round(inner),
				outer: distances.length ? Math.round(Math.min(...distances)) : null
			});
		}
	}

	// ---- similarity (G2, S5): style signatures per role ----
	const MAX_ROLE_ELEMENTS = 300; // elements inspected per role
	const MAX_SIGNATURES = 12; // distinct signatures reported per role
	const borderOf = (s) => (px(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' ? `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}` : 'none');
	const signatureOf = (e) => {
		const s = cs(e);
		return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, background: s.backgroundColor, border: borderOf(s), radius: s.borderRadius, shadow: s.boxShadow, padding: s.padding };
	};
	const roleVariants = (elements) => {
		const groups = new Map();
		for (const e of elements.slice(0, MAX_ROLE_ELEMENTS)) {
			const signature = signatureOf(e);
			const key = JSON.stringify(signature);
			const group = groups.get(key) || { signature, count: 0, sample: { selector: selectorOf(e), box: boxOf(e) } };
			group.count += 1;
			groups.set(key, group);
		}
		return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, MAX_SIGNATURES);
	};
	// Link inside a sentence: the parent holds text beyond its links (nav bars and link lists do not).
	const bare = (text) => text.replace(/\s+/g, '').length;
	const isInlineInText = (e) => {
		const parent = e.parentElement;
		if (cs(e).display !== 'inline' || !parent) return false;
		const linkText = [...parent.querySelectorAll('a')].reduce((n, a) => n + bare(a.textContent), 0);
		return bare(parent.textContent) - linkText > 0;
	};
	// A link styled as a button: not inline, a text label of at most 40 characters, a visible edge (fill or border), button
	// size (at most 80 px high) and padding on the side or top. Buttons often get their height from `min-height`, so side padding counts.
	const BUTTON_LINK_MAX_HEIGHT = 80; // own value
	const BUTTON_LINK_MAX_CHARS = 40; // own value
	const looksLikeButtonLink = (e) => {
		if (e.tagName !== 'A' || !e.hasAttribute('href') || cs(e).display === 'inline' || !sizedLikeButton(e) || !hasVisibleEdge(e)) return false;
		if (e.getBoundingClientRect().height > BUTTON_LINK_MAX_HEIGHT || !hasLabelText(e) || isImageLink(e) || bare(e.innerText || '') > BUTTON_LINK_MAX_CHARS) return false;
		return px(cs(e).paddingTop) >= 6 || px(cs(e).paddingLeft) >= 12;
	};
	const isCard = (e) => ['ARTICLE', 'LI', 'DIV'].includes(e.tagName) && px(cs(e).borderRadius) >= 6 && hasVisibleEdge(e) && e.getBoundingClientRect().height > 120;
	const roles = {
		// On/off toggles (aria-pressed, role=switch) and icon-only buttons are separate control families and stay out of the button role.
		buttons: roleVariants(vis.filter((e) => (e.matches('button, [role=button], input[type=submit], input[type=button]') && !isToggle(e) && hasLabelText(e)) || looksLikeButtonLink(e))),
		links: roleVariants(vis.filter((e) => e.tagName === 'A' && e.hasAttribute('href') && isInlineInText(e))),
		cards: roleVariants(vis.filter(isCard))
	};
	for (const level of [1, 2, 3, 4, 5, 6]) roles[`h${level}`] = roleVariants(vis.filter((e) => e.tagName === `H${level}`));

	// Rounded boxes (radius above 0, a visible edge, at least 16 x 16 px) and every shadow, counted by value.
	const radii = {};
	const shadows = {};
	for (const e of vis) {
		const s = cs(e);
		if (s.boxShadow !== 'none') add(shadows, s.boxShadow, 1);
		if (px(s.borderRadius) > 0 && hasVisibleEdge(e)) {
			const r = e.getBoundingClientRect();
			if (r.width >= 16 && r.height >= 16) add(radii, s.borderRadius, 1);
		}
	}

	// ---- common region (G3): nesting depth of containers with a visible edge ----
	// A container has a visible edge, is not inline, is at least 48 x 32 px, and is not a control, link or media element.
	// Depth = containers on the way from the element up to <body>, itself included.
	const REGION_EXCLUDED = /^(HTML|BODY|A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|IMG|SVG|VIDEO|CANVAS|PICTURE|IFRAME)$/;
	const DEEP_FROM = 3; // containers at this depth or deeper are listed
	const MAX_DEEP_LISTED = 10;
	const regionCache = new WeakMap();
	const isRegion = (e) => {
		if (regionCache.has(e)) return regionCache.get(e);
		const r = e.getBoundingClientRect();
		const result = !REGION_EXCLUDED.test(e.tagName) && cs(e).display !== 'inline' && r.width >= 48 && r.height >= 32 && hasVisibleEdge(e);
		regionCache.set(e, result);
		return result;
	};
	const depthCache = new WeakMap();
	const depthOf = (e) => {
		if (!e || e === document.body || e === document.documentElement) return 0;
		if (depthCache.has(e)) return depthCache.get(e);
		const depth = (isRegion(e) ? 1 : 0) + depthOf(e.parentElement);
		depthCache.set(e, depth);
		return depth;
	};
	const distribution = {};
	const deepRegions = [];
	for (const e of vis) {
		if (!isRegion(e)) continue;
		const depth = depthOf(e);
		add(distribution, depth, 1);
		if (depth >= DEEP_FROM) deepRegions.push({ selector: selectorOf(e), box: boxOf(e), depth });
	}
	const deep = deepRegions.sort((a, b) => b.depth - a.depth).slice(0, MAX_DEEP_LISTED);

	// ---- colour (C1, C2, C3): raw weighted colours; OKLCH conversion and hue binning happen in lib/colour.mjs ----
	// Text colours are weighted by text length, background colours by painted area (width x height of the box in px,
	// overlapping boxes count twice). Interactive elements list their colours as accent candidates.
	const MAX_INTERACTIVE = 60;
	const textColors = {};
	for (const e of textEls) add(textColors, cs(e).color, ownText(e).length);
	const backgroundColors = {};
	for (const e of vis) {
		const bg = cs(e).backgroundColor;
		if (isTransparent(bg)) continue;
		const r = e.getBoundingClientRect();
		add(backgroundColors, bg, Math.round(r.width * r.height));
	}
	const interactive = vis
		.filter((e) => e.matches('button, [role=button], input[type=submit], input[type=button]') || looksLikeButtonLink(e) || (e.tagName === 'A' && e.hasAttribute('href')))
		.slice(0, MAX_INTERACTIVE)
		.map((e) => {
			const s = cs(e);
			const isLink = e.tagName === 'A' && !looksLikeButtonLink(e);
			return { kind: isLink ? 'link' : 'button', color: s.color, background: s.backgroundColor, selector: selectorOf(e), box: boxOf(e) };
		});

	return {
		limits: { total: allElements.length, scanned: scanned.length, capped: allElements.length > MAX_ELEMENTS },
		proximity: { headings, labels, groups },
		similarity: { roles, radii, shadows },
		region: { distribution, deep },
		colour: { text: textColors, backgrounds: backgroundColors, interactive }
	};
})();
