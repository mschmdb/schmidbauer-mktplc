// Page measurement, evaluated inside the page. Returns one JSON-serializable object.
// audit.mjs injects this file; it can also run in any browser tool that evaluates JavaScript.
// Counts are signals for the guidelines, not verdicts.
(() => {
	const ACCENT_MARKER = ' ACCENT ';
	const cs = (el) => getComputedStyle(el);
	// Rendered, not transparent, not a 1 px sr-only clip, and inside the document box.
	const visible = (el) => {
		if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false;
		const r = el.getBoundingClientRect();
		if (r.width <= 1 && r.height <= 1) return false;
		const docWidth = document.documentElement.scrollWidth;
		const docHeight = document.documentElement.scrollHeight;
		const left = r.left + window.scrollX;
		const top = r.top + window.scrollY;
		return r.width > 0 && r.height > 0 && left + r.width > 0 && top + r.height > 0 && left < docWidth && top < docHeight;
	};
	// Text that a sighted reader can read: visible and not hidden from assistive tech as decoration.
	const readable = (el) => visible(el) && !el.closest('[aria-hidden="true"]');
	const textEls = [...document.querySelectorAll('body *')].filter(
		(el) => readable(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
	);
	const isTransparent = (c) => c === 'transparent' || /(,\s*|\/\s*)0(\.0+)?%?\)$/.test(c);
	// Nearest ancestor background that is not transparent; the canvas is white by default.
	const effectiveBg = (el) => {
		for (let n = el; n; n = n.parentElement) {
			const bg = cs(n).backgroundColor;
			if (!isTransparent(bg)) return bg;
		}
		return 'rgb(255, 255, 255)';
	};
	// A box looks like a card only when something draws its edge: shadow, a real border, or its own fill.
	// Tailwind preflight sets `border: 0 solid`, so border-style alone says nothing.
	const hasVisibleEdge = (el) => {
		const s = cs(el);
		const border = ['Top', 'Right', 'Bottom', 'Left'].some(
			(side) => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none' && !isTransparent(s[`border${side}Color`])
		);
		const fill = !isTransparent(s.backgroundColor) && s.backgroundColor !== effectiveBg(el.parentElement);
		return s.boxShadow !== 'none' || border || fill;
	};
	const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});

	// First font family of text outside code samples. audit.mjs classifies monospace with lib/fonts.mjs.
	const fontsOutsideCode = count(textEls.filter((e) => !e.closest('code, pre, kbd, samp, tt')).map((e) => cs(e).fontFamily.split(',')[0].trim()));
	const fonts = count(textEls.map((e) => cs(e).fontFamily.split(',')[0]));
	const sizes = count(textEls.map((e) => cs(e).fontSize));
	const colors = count(textEls.map((e) => cs(e).color));

	// Characters per line, measured: every character gets its own client rect, rects are grouped by line.
	// charsPerLine is the median over full lines (the last line is usually short); charsPerLineMax is the longest line.
	// Only running text inside the main content counts, not navigation, header, footer or sidebars.
	const contentRoot = document.querySelector('main, [role=main]') || document.body;
	const isChrome = (e) => !!e.closest('nav, header, footer, aside, [role=navigation], [role=banner], [role=contentinfo]');
	const median = (nums) => {
		const sorted = [...nums].sort((x, y) => x - y);
		return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
	};
	const measureLines = (el) => {
		const lines = new Map();
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const range = document.createRange();
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			if (node.parentElement && !readable(node.parentElement)) continue;
			for (let i = 0; i < node.length; i++) {
				range.setStart(node, i);
				range.setEnd(node, i + 1);
				const rect = range.getClientRects()[0];
				if (!rect || rect.width === 0) continue; // collapsed whitespace has no box
				const key = Math.round(rect.top / 4);
				lines.set(key, (lines.get(key) || 0) + 1);
			}
		}
		return [...lines.entries()].sort((x, y) => x[0] - y[0]).map(([, n]) => n);
	};
	const paragraphs = [...contentRoot.querySelectorAll('p, li')]
		.filter((e) => readable(e) && !isChrome(e) && e.textContent.trim().length > 80)
		.slice(0, 15)
		.map((e) => {
			const s = cs(e);
			const counts = measureLines(e);
			const full = counts.length > 1 ? counts.slice(0, -1) : counts;
			return {
				fontSize: s.fontSize,
				lineHeight: s.lineHeight,
				width: Math.round(e.getBoundingClientRect().width),
				lines: counts.length,
				charsPerLine: median(full),
				charsPerLineMax: Math.max(0, ...counts),
				text: e.textContent.trim().slice(0, 50)
			};
		});

	// Targets under 24 x 24 CSS px (WCAG 2.5.8). Exempt: inline links inside running text, hidden native inputs
	// (their visible label is measured instead). An undersized target passes on spacing when a 24 px circle
	// centred on it touches no other target. Counts are signals; confirm by hand.
	const TARGET_MIN = 24;
	// Link inside a sentence: the parent holds text beyond its links (nav bars and link lists do not).
	const isInlineInText = (e) => {
		const parent = e.parentElement;
		if (e.tagName !== 'A' || cs(e).display !== 'inline' || !parent) return false;
		const bare = (text) => text.replace(/\s+/g, '').length;
		const linkText = [...parent.querySelectorAll('a')].reduce((n, a) => n + bare(a.textContent), 0);
		return bare(parent.textContent) - linkText > 0;
	};
	const targetBox = (e) => {
		if (e.tagName === 'INPUT' && !visible(e)) {
			const label = e.labels && e.labels[0];
			return label && visible(label) ? label : null;
		}
		return visible(e) ? e : null;
	};
	const targets = [
		...new Set(
			[...document.querySelectorAll('a[href], button, [role=button], input:not([type=hidden]), select, summary')]
				.map(targetBox)
				.filter(Boolean)
		)
	].filter((e) => !isInlineInText(e));
	const rects = targets.map((e) => ({ el: e, r: e.getBoundingClientRect() }));
	const touchesCircle = (a, b) => {
		const cx = a.r.left + a.r.width / 2;
		const cy = a.r.top + a.r.height / 2;
		const small = b.r.width < TARGET_MIN || b.r.height < TARGET_MIN;
		if (small) {
			const dx = cx - (b.r.left + b.r.width / 2);
			const dy = cy - (b.r.top + b.r.height / 2);
			return Math.hypot(dx, dy) < TARGET_MIN;
		}
		const nx = Math.max(b.r.left, Math.min(cx, b.r.right));
		const ny = Math.max(b.r.top, Math.min(cy, b.r.bottom));
		return Math.hypot(cx - nx, cy - ny) < TARGET_MIN / 2;
	};
	const small = rects
		.filter(({ r }) => r.width < TARGET_MIN || r.height < TARGET_MIN)
		.map((a) => ({ ...a, spacingOk: !rects.some((b) => b !== a && touchesCircle(a, b)) }));
	const smallTargets = {
		total: small.length,
		failingSpacing: small.filter((t) => !t.spacingOk).length,
		items: small.slice(0, 25).map(({ el, r, spacingOk }) => {
			const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30);
			return `${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName} ${label}${spacingOk ? ' (spacing ok)' : ''}`;
		})
	};

	const headings = [...document.querySelectorAll('h1, h2, h3, h4')].map((e) => {
		// Only visible parts that differ from the heading in color, style or weight.
		const h = cs(e);
		const accents = [...e.querySelectorAll('em, i, strong, b, span')]
			.filter((c) => c.textContent.trim() && c.getBoundingClientRect().width > 1)
			.filter((c) => {
				const s = cs(c);
				return s.color !== h.color || s.fontStyle !== h.fontStyle || s.fontWeight !== h.fontWeight;
			})
			.map((c) => `${cs(c).fontStyle}/${cs(c).fontWeight}/${cs(c).color}: ${c.textContent.trim().slice(0, 30)}`);
		const text = `${e.tagName} ${h.fontSize}/${h.fontWeight} "${e.textContent.trim().slice(0, 60)}"`;
		return { text, accents, line: accents.length ? text + ACCENT_MARKER + accents.join(' | ') : text };
	});

	// AI-look signals (rule 31). Count, don't judge.
	const upperLabels = textEls.filter((e) => {
		const s = cs(e);
		return s.textTransform === 'uppercase' && parseFloat(s.letterSpacing) > 0 && e.textContent.trim().length < 60;
	});
	const bodyText = document.body.innerText;
	const tells = {
		uppercaseTrackedLabels: upperLabels.length,
		uppercaseLabelExamples: upperLabels.slice(0, 8).map((e) => e.textContent.trim().slice(0, 40)),
		middleDotStrings: (bodyText.match(/\S\s+·\s+\S/g) || []).length,
		// Arrows as call-to-action suffix: only link and button labels, not arrows in running text.
		arrowSuffixes: [...document.querySelectorAll('a, button, [role=button]')].filter(
			(e) => readable(e) && /[→↗↘➔➜]\s*$/.test(e.textContent.trim())
		).length,
		headingAccents: headings.filter((h) => h.accents.length > 0).length,
		// Elements whose whole text is 01 to 09 (optionally with a dot), outside <time>. Dates in running text do not match.
		numberedMarkers: textEls.filter((e) => /^0[1-9][.:]?$/.test(e.textContent.trim()) && !e.closest('time')).length,
		emDashes: (bodyText.match(/—/g) || []).length,
		cardLikeBoxes: [...document.querySelectorAll('article, li, div')].filter((e) => {
			const s = cs(e);
			return (
				visible(e) &&
				parseFloat(s.borderRadius) >= 6 &&
				hasVisibleEdge(e) &&
				e.getBoundingClientRect().height > 120
			);
		}).length
	};

	// Text repetition (rule 32): measure.js only collects the copy a reader meets in the content.
	// Navigation, header chrome, footer, scripts and hidden text are skipped. One block per line,
	// so word groups never span blocks. audit.mjs counts the phrases with lib/ngrams.mjs.
	const chromeSelector = 'nav, footer, [role=navigation], [role=contentinfo], script, style, noscript, template';
	const blockOf = (node) => {
		let e = node.parentElement;
		while (e && e.parentElement && cs(e).display.startsWith('inline')) e = e.parentElement;
		return e;
	};
	const contentLines = [];
	let lastBlock = null;
	const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let node = textWalker.nextNode(); node; node = textWalker.nextNode()) {
		const parent = node.parentElement;
		const text = node.data.replace(/\s+/g, ' ').trim();
		if (!text || !parent || parent.closest(chromeSelector) || !readable(parent)) continue;
		const block = blockOf(node);
		if (block === lastBlock && contentLines.length) contentLines[contentLines.length - 1] += ` ${text}`;
		else contentLines.push(text);
		lastBlock = block;
	}
	const contentText = contentLines.join('\n');

	// First viewport (rule 16): what a visitor sees before scrolling or interacting.
	// Configured size, not window.innerWidth: mobile emulation widens innerWidth (and height) when the page overflows sideways.
	const vpWidth = window.__auditViewport?.width ?? document.documentElement.clientWidth;
	const vpHeight = window.__auditViewport?.height ?? window.innerHeight;
	const inFirstViewport = (e) => {
		const r = e.getBoundingClientRect();
		return visible(e) && r.top < vpHeight && r.bottom > 0 && r.left < vpWidth && r.right > 0;
	};
	const snippet = (e) => (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 80);
	const firstViewportActions = [...document.querySelectorAll('a[href], button, [role=button], input[type=submit]')]
		.filter(inFirstViewport)
		.map((e) => `${e.tagName} "${snippet(e)}"`)
		.slice(0, 15);
	const firstViewport = {
		viewport: `${vpWidth}x${vpHeight}`,
		headings: [...document.querySelectorAll('h1, h2, h3')].filter(inFirstViewport).map(snippet),
		text: [...document.querySelectorAll('p, li')]
			.filter((e) => inFirstViewport(e) && e.textContent.trim().length > 20)
			.map(snippet)
			.slice(0, 8),
		actions: firstViewportActions,
		hasAction: firstViewportActions.length > 0
	};

	const sheetsContain = (needle) =>
		[...document.styleSheets].some((s) => {
			try {
				return [...s.cssRules].some((r) => r.cssText.includes(needle));
			} catch {
				return false; // Cross-origin stylesheet: not readable, so not counted.
			}
		});

	return {
		title: document.title,
		lang: document.documentElement.lang,
		bodyBg: cs(document.body).backgroundColor,
		pageHeight: document.documentElement.scrollHeight,
		firstViewport,
		fonts,
		fontsOutsideCode,
		contentText,
		sizes,
		colors,
		paragraphs,
		smallTargets,
		headings: headings.map((h) => h.line),
		tells,
		hasMain: !!document.querySelector('main'),
		firstLinkText: document.querySelector('a')?.textContent.trim().slice(0, 40),
		reducedMotionRule: sheetsContain('prefers-reduced-motion'),
		colorSchemeRule: sheetsContain('prefers-color-scheme'),
		runningAnimations: document.getAnimations().length,
		canvases: document.querySelectorAll('canvas').length,
		videos: document.querySelectorAll('video').length
	};
})();
