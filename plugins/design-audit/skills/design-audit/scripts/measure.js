// Page measurement, evaluated inside the page. Returns one JSON-serializable object.
// audit.mjs injects this file; it can also run in any browser tool that evaluates JavaScript.
// Counts are signals for the guidelines, not verdicts.
(() => {
	const ACCENT_MARKER = ' ACCENT ';
	const cs = (el) => getComputedStyle(el);
	const visible = (el) => {
		const s = cs(el);
		const r = el.getBoundingClientRect();
		return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
	};
	const textEls = [...document.querySelectorAll('body *')].filter(
		(el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
	);
	const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});

	const fonts = count(textEls.map((e) => cs(e).fontFamily.split(',')[0]));
	const sizes = count(textEls.map((e) => cs(e).fontSize));
	const colors = count(textEls.map((e) => cs(e).color));

	// Characters per line is an estimate: element width divided by an average glyph width of 0.5 em.
	// Narrow or wide typefaces shift it noticeably. Report it as an estimate (rule 13).
	const paragraphs = [...document.querySelectorAll('p, li')]
		.filter((e) => visible(e) && e.textContent.trim().length > 80)
		.slice(0, 15)
		.map((e) => {
			const s = cs(e);
			const w = e.getBoundingClientRect().width;
			return {
				fontSize: s.fontSize,
				lineHeight: s.lineHeight,
				width: Math.round(w),
				charsPerLineEstimate: Math.round(w / (parseFloat(s.fontSize) * 0.5)),
				text: e.textContent.trim().slice(0, 50)
			};
		});

	// Targets under 24 × 24 CSS px (rule 23). WCAG 2.5.8 has exceptions (spacing, inline links); check them by hand.
	const smallTargets = [...document.querySelectorAll('a, button, [role=button], input, select, summary')]
		.filter(visible)
		.filter((e) => {
			const r = e.getBoundingClientRect();
			return r.width < 24 || r.height < 24;
		})
		.slice(0, 25)
		.map((e) => {
			const r = e.getBoundingClientRect();
			const label = (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30);
			return `${Math.round(r.width)}x${Math.round(r.height)} ${e.tagName} ${label}`;
		});

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
		arrowSuffixes: (bodyText.match(/[→↗]/g) || []).length,
		monoTextElements: textEls.filter((e) => /mono/i.test(cs(e).fontFamily)).length,
		headingAccents: headings.filter((h) => h.accents.length > 0).length,
		numberedMarkers: (bodyText.match(/(^|\s)0[1-9](\s|$)/g) || []).length,
		emDashes: (bodyText.match(/—/g) || []).length,
		cardLikeBoxes: [...document.querySelectorAll('article, li, div')].filter((e) => {
			const s = cs(e);
			return (
				visible(e) &&
				parseFloat(s.borderRadius) >= 6 &&
				(s.boxShadow !== 'none' || s.borderStyle !== 'none') &&
				e.getBoundingClientRect().height > 120
			);
		}).length
	};

	// Text repetition (rule 32): most frequent word pairs and triples.
	const words = bodyText
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, ' ')
		.split(/\s+/)
		.filter((w) => w.length > 2);
	const ngrams = {};
	for (const n of [2, 3]) {
		for (let i = 0; i + n <= words.length; i++) {
			const g = words.slice(i, i + n).join(' ');
			ngrams[g] = (ngrams[g] || 0) + 1;
		}
	}
	const repeated = Object.entries(ngrams)
		.filter(([, c]) => c >= 3)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 20);

	// First viewport (rule 16): what a visitor sees before scrolling or interacting.
	const inFirstViewport = (e) => {
		const r = e.getBoundingClientRect();
		return visible(e) && r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
	};
	const snippet = (e) => (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 80);
	const firstViewportActions = [...document.querySelectorAll('a[href], button, [role=button], input[type=submit]')]
		.filter(inFirstViewport)
		.map((e) => `${e.tagName} "${snippet(e)}"`)
		.slice(0, 15);
	const firstViewport = {
		viewport: `${window.innerWidth}x${window.innerHeight}`,
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
		sizes,
		colors,
		paragraphs,
		smallTargets,
		headings: headings.map((h) => h.line),
		tells,
		repeated,
		hasMain: !!document.querySelector('main'),
		firstLinkText: document.querySelector('a')?.textContent.trim().slice(0, 40),
		reducedMotionRule: sheetsContain('prefers-reduced-motion'),
		colorSchemeRule: sheetsContain('prefers-color-scheme'),
		runningAnimations: document.getAnimations().length,
		canvases: document.querySelectorAll('canvas').length,
		videos: document.querySelectorAll('video').length
	};
})();
