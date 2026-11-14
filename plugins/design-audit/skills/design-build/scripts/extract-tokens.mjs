#!/usr/bin/env node
// Print OBSERVED design tokens of a live page as JSON: what the browser computes,
// not what the design specifies. Use it for intake when no token file exists.
//
// Usage: node extract-tokens.mjs <url>
// Output: JSON on stdout. Errors go to stderr. Exit code 2 when Playwright is missing.
//
// Dependencies: this script does not install anything. It resolves Playwright from the
// design-audit skill: ../../design-audit/scripts/node_modules. Run the setup of the
// design-audit skill first (install in skills/design-audit/scripts, then
// `pnpm exec playwright install chromium`). The path exists only when the plugin is
// installed as a whole.
//
// Limits: custom properties come from :root and html rules only (media queries that
// match the viewport count). Theme scopes such as [data-theme='dark'] are not read.
// Tailwind built-ins are dropped: --tw-* always; names of Tailwind's default theme
// (TAILWIND_DEFAULT_PATTERN) only when declared inside `@layer theme` and not declared
// anywhere else. A default that the project overrides inside @theme is dropped too; it is
// listed in tailwindDefaultsOmitted. undefinedProperties lists var(--x) uses with no
// declaration in any same-origin stylesheet or style attribute (--tw-* excluded).
// Cross-origin stylesheets are skipped. Counts cover up to MAX_ELEMENTS elements.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const MAX_ELEMENTS = 6000;
const DESKTOP = { width: 1440, height: 900 };
const MOBILE_DEVICE = 'iPhone 13';

const SIZES = 'xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl';
/** Names of Tailwind v4's default theme (sub-properties such as --text-xs--line-height included). */
export const TAILWIND_DEFAULT_PATTERN = new RegExp(
	`^--(?:default-[a-z-]+|font-(?:sans|serif|mono)(?:--[a-z-]+)?|font-weight-[a-z]+|text-(?:${SIZES})(?:--[a-z-]+)?|tracking-[a-z]+|leading-[a-z]+|radius-(?:${SIZES})|shadow-(?:2xs|${SIZES})|inset-shadow-(?:2xs|${SIZES})|drop-shadow-(?:${SIZES})|blur-(?:${SIZES})|perspective-[a-z]+|aspect-[a-z]+|ease-[a-z-]+|animate-[a-z]+|breakpoint-(?:${SIZES})|container-(?:3xs|2xs|${SIZES})|spacing|color-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|taupe|mauve|mist|olive)-\\d+|color-(?:black|white))$`
);

/**
 * @typedef {{ value: string, count: number }} Counted
 * @typedef {{ name: string, value: string }} CustomProperty
 * @typedef {{
 *   viewport: { width: number, height: number },
 *   customProperties: CustomProperty[],
 *   tailwindDefaultsOmitted: string[],
 *   undefinedProperties: { name: string, hasFallback: boolean }[],
 *   fontFamilies: Counted[], fontSizes: Counted[], fontWeights: Counted[], lineHeights: Counted[],
 *   textColors: Counted[], backgroundColors: Counted[], spacing: Counted[],
 *   radii: Counted[], shadows: Counted[], elementsScanned: number
 * }} ViewportTokens
 * @typedef {{ url: string, viewports: { desktop: ViewportTokens, mobile: ViewportTokens } }} TokenReport
 */

/**
 * Resolve Playwright from the design-audit scripts folder.
 * @returns {Promise<typeof import('playwright') | null>}
 */
export async function loadPlaywright() {
	try {
		const require = createRequire(new URL('../../design-audit/scripts/package.json', import.meta.url));
		return require('playwright');
	} catch {
		return null;
	}
}

/**
 * Sort a count map by count (descending), keeping insertion order for ties.
 * @param {Map<string, number>} map
 * @returns {Counted[]}
 */
export function topValues(map) {
	return [...map.entries()]
		.map(([value, count], index) => ({ value, count, index }))
		.sort((a, b) => b.count - a.count || a.index - b.index)
		.map(({ value, count }) => ({ value, count }));
}

/** Runs inside the page. Returns plain arrays of [value, count] pairs. */
function collectInPage([maxElements, defaultSource]) {
	const defaultPattern = new RegExp(defaultSource);
	const counters = {
		fontFamilies: new Map(), fontSizes: new Map(), fontWeights: new Map(), lineHeights: new Map(),
		textColors: new Map(), backgroundColors: new Map(), spacing: new Map(), radii: new Map(), shadows: new Map()
	};
	const bump = (key, value) => counters[key].set(value, (counters[key].get(value) ?? 0) + 1);
	const firstFamily = (stack) => stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
	const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '');

	const elements = [...document.body.querySelectorAll('*')].slice(0, maxElements);
	let scanned = 0;
	for (const el of elements) {
		const s = getComputedStyle(el);
		if (s.display === 'none' || s.visibility === 'hidden') continue;
		if (el.closest('script, style, noscript, template')) continue;
		scanned++;
		if (hasOwnText(el)) {
			bump('fontFamilies', firstFamily(s.fontFamily));
			bump('fontSizes', s.fontSize);
			bump('fontWeights', s.fontWeight);
			bump('lineHeights', s.lineHeight);
			bump('textColors', s.color);
		}
		const bg = s.backgroundColor;
		if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') bump('backgroundColors', bg);
		for (const prop of ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap']) {
			const v = s[prop];
			if (v && v !== '0px' && v !== 'normal' && v !== 'auto') bump('spacing', v);
		}
		const radius = s.borderTopLeftRadius;
		if (radius && radius !== '0px') bump('radii', radius);
		if (s.boxShadow && s.boxShadow !== 'none') bump('shadows', s.boxShadow);
	}

	const names = new Set();
	const layered = new Set();
	const readRules = (rules, inThemeLayer) => {
		for (const rule of rules) {
			if (rule.media && !matchMedia(rule.media.mediaText).matches) continue;
			if (rule.selectorText !== undefined) {
				const onRoot = rule.selectorText.split(',').some((sel) => ['html', ':root'].includes(sel.trim()));
				if (!onRoot) continue;
				for (const name of rule.style) {
					if (!name.startsWith('--')) continue;
					names.add(name);
					if (inThemeLayer) layered.add(name);
				}
			} else if (rule.cssRules) {
				readRules(rule.cssRules, inThemeLayer || (rule.constructor.name === 'CSSLayerBlockRule' && rule.name === 'theme'));
			}
		}
	};
	const cssTexts = [...document.querySelectorAll('[style]')].map((el) => el.getAttribute('style'));
	for (const sheet of document.styleSheets) {
		try {
			readRules(sheet.cssRules, false);
			for (const rule of sheet.cssRules) cssTexts.push(rule.cssText);
		} catch { /* cross-origin stylesheet */ }
	}
	const declaredAnywhere = new Set();
	const used = new Map();
	for (const text of cssTexts) {
		for (const m of text.matchAll(/(--[\w-]+)\s*:/g)) declaredAnywhere.add(m[1]);
		for (const m of text.matchAll(/@property\s+(--[\w-]+)/g)) declaredAnywhere.add(m[1]);
		for (const m of text.matchAll(/var\(\s*(--[\w-]+)\s*(,?)/g)) used.set(m[1], (used.get(m[1]) ?? false) || m[2] === ',');
	}
	const rootStyle = getComputedStyle(document.documentElement);
	const undefinedProperties = [...used]
		.filter(([name]) => !name.startsWith('--tw-') && !declaredAnywhere.has(name) && rootStyle.getPropertyValue(name).trim() === '')
		.map(([name, hasFallback]) => ({ name, hasFallback }));

	const isBuiltIn = (name) => name.startsWith('--tw-') || (layered.has(name) && defaultPattern.test(name));
	const tailwindDefaultsOmitted = [...names].filter(isBuiltIn);
	const customProperties = [...names].filter((n) => !isBuiltIn(n)).map((name) => ({ name, value: rootStyle.getPropertyValue(name).trim() }));

	return {
		customProperties,
		tailwindDefaultsOmitted,
		undefinedProperties,
		scanned,
		counters: Object.fromEntries(Object.entries(counters).map(([k, m]) => [k, [...m.entries()]]))
	};
}

/**
 * @param {import('playwright').Page} page
 * @param {{ width: number, height: number }} viewport
 * @returns {Promise<ViewportTokens>}
 */
async function readViewport(page, viewport) {
	const data = await page.evaluate(collectInPage, [MAX_ELEMENTS, TAILWIND_DEFAULT_PATTERN.source]);
	const list = (key) => topValues(new Map(data.counters[key]));
	return {
		viewport,
		customProperties: data.customProperties,
		tailwindDefaultsOmitted: data.tailwindDefaultsOmitted,
		undefinedProperties: data.undefinedProperties,
		fontFamilies: list('fontFamilies'), fontSizes: list('fontSizes'),
		fontWeights: list('fontWeights'), lineHeights: list('lineHeights'),
		textColors: list('textColors'), backgroundColors: list('backgroundColors'),
		spacing: list('spacing'), radii: list('radii'), shadows: list('shadows'),
		elementsScanned: data.scanned
	};
}

/**
 * Open the URL at desktop and mobile size and collect observed tokens.
 * @param {string} url
 * @param {typeof import('playwright')} playwright
 * @returns {Promise<TokenReport>}
 */
export async function extractFromUrl(url, playwright) {
	const browser = await playwright.chromium.launch();
	try {
		const mobileDevice = playwright.devices[MOBILE_DEVICE];
		const contexts = {
			desktop: await browser.newContext({ viewport: DESKTOP }),
			mobile: await browser.newContext({ ...mobileDevice })
		};
		/** @type {Record<string, ViewportTokens>} */
		const viewports = {};
		for (const [name, context] of Object.entries(contexts)) {
			const page = await context.newPage();
			await page.goto(url, { waitUntil: 'load' });
			await page.evaluate(() => document.fonts.ready);
			viewports[name] = await readViewport(page, page.viewportSize());
		}
		return { url, viewports: /** @type {TokenReport['viewports']} */ (viewports) };
	} finally {
		await browser.close();
	}
}

async function main() {
	const url = process.argv[2];
	if (!url) {
		process.stderr.write('Usage: node extract-tokens.mjs <url>\n');
		process.exit(2);
	}
	const playwright = await loadPlaywright();
	if (!playwright) {
		process.stderr.write(
			'Playwright not found. Run the setup of the design-audit skill first: install the dependencies in skills/design-audit/scripts, then run `pnpm exec playwright install chromium`.\n'
		);
		process.exit(2);
	}
	const report = await extractFromUrl(url, playwright);
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	});
}
