import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureDesignFixture, skipReason } from './browser-helpers.mjs';
import { deriveTypography } from './lib/typography.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('typography: clean fixture reports Georgia, 18 px body, 48 px h1 and tracked-free caps', opts, async () => {
	const raw = await measureDesignFixture('design-clean.html');
	const t = deriveTypography(raw.typography);
	assert.deepEqual(t.families.map((f) => f.family), ['Georgia']);
	assert.equal(t.bodySize, 16, 'cards and form use 16 px');
	assert.ok(t.sizes.some((s) => s.px === 18));
	assert.equal(t.h1.fontSize, 48);
	assert.ok(t.h1.words === 5);
	assert.ok(t.h1.ratioToBody >= 2.5);
	assert.deepEqual(t.uppercase, []);
	assert.deepEqual(t.justified, []);
	assert.deepEqual(t.centered, []);
	const bodyRatios = t.lineHeight.body.samples.map((s) => s.ratio);
	assert.ok(bodyRatios.length >= 1 && bodyRatios.every((r) => r >= 1.4 && r <= 1.7), `ratios ${bodyRatios}`);
	assert.ok(t.lineHeight.headings.median >= 1.2 && t.lineHeight.headings.median <= 1.3);
});

test('typography: generic fixture reports Inter, tracked caps and centred text', opts, async () => {
	const raw = await measureDesignFixture('design-generic-ai.html');
	const t = deriveTypography(raw.typography);
	assert.deepEqual(t.families.map((f) => f.family), ['Inter']);
	assert.ok(t.uppercase.length >= 1);
	assert.ok(Math.abs(t.uppercase[0].letterSpacingEm - 0.12) < 0.01, `em ${t.uppercase[0].letterSpacingEm}`);
	assert.equal(t.h1.fontSize, 56);
});

test('typography: lists carry a selector that resolves to the element and a bounding box', opts, async () => {
	const raw = await measureDesignFixture('design-generic-ai.html');
	assert.match(raw.typography.h1.selector, /h1/);
	assert.ok(raw.typography.h1.box.w > 0 && raw.typography.h1.box.h > 0);
});

test('typography: justified and long centred paragraphs are listed with hyphens and line count', opts, async () => {
	const raw = await measureDesignFixture('design-typography.html', { viewport: { width: 600, height: 800 } });
	const t = deriveTypography(raw.typography);
	assert.equal(t.justified.length, 1);
	assert.equal(t.justified[0].hyphens, 'manual');
	assert.ok(t.justified[0].lines >= 3);
	assert.equal(t.centered.length, 1, 'only the long centred paragraph counts');
	assert.ok(t.centered[0].lines > 3);
	assert.ok(t.uppercase.some((u) => u.letterSpacingEm === 0));
});

test('typography: icon fonts and code-only families are excluded', opts, async () => {
	const raw = await measureDesignFixture('design-typography.html');
	const t = deriveTypography(raw.typography);
	const names = t.families.map((f) => f.family);
	assert.ok(!names.some((n) => /awesome|mono/i.test(n)), names.join(','));
	assert.ok(names.includes('Inter'), 'hash suffix stripped');
});

test('spacing: clean fixture sits on a 4 px grid, violation fixture does not', opts, async () => {
	const { deriveSpacing } = await import('./lib/spacing.mjs');
	const clean = deriveSpacing((await measureDesignFixture('design-clean.html')).spacing);
	const messy = deriveSpacing((await measureDesignFixture('design-gestalt-violations.html')).spacing);
	assert.ok(clean.fit4Exact >= 0.9, `clean fit4Exact ${clean.fit4Exact}`);
	assert.ok(messy.fit4Exact < clean.fit4Exact, `messy ${messy.fit4Exact}`);
	assert.ok(messy.distinct > clean.distinct, `distinct ${messy.distinct} vs ${clean.distinct}`);
	assert.ok(clean.histogram.every((h) => h.px > 0));
	assert.equal(clean.sections.items[0].tag, 'HEADER');
	assert.equal(clean.sections.items[0].paddingTop, 16);
});

test('spacing: side margins of text blocks are measured to the viewport edge on mobile', opts, async () => {
	const { deriveSpacing } = await import('./lib/spacing.mjs');
	const raw = await measureDesignFixture('design-gestalt-violations.html', { viewport: { width: 390, height: 800 } });
	const sp = deriveSpacing(raw.spacing);
	assert.equal(sp.sideMargins.minLeft, 23);
	assert.equal(sp.sideMargins.minRight, 23);
	assert.deepEqual(sp.sideMargins.narrow, []);
});

test('alignment: jittering left edges give separate clusters, aligned columns do not', opts, async () => {
	const { deriveAlignment } = await import('./lib/spacing.mjs');
	const jitter = deriveAlignment((await measureDesignFixture('design-gestalt-violations.html')).alignment);
	const clean = deriveAlignment((await measureDesignFixture('design-clean.html')).alignment);
	const xs = jitter.top.map((c) => c.x);
	const base = Math.min(...xs);
	for (const offset of [5, 11, 17]) assert.ok(xs.includes(base + offset), `edge at base+${offset} in ${xs}`);
	assert.ok(jitter.distinct >= 4);
	assert.ok(clean.distinct <= 5, `clean distinct ${clean.distinct}`);
	assert.ok(clean.top[0].samples[0].selector.length > 0);
});

test('limits: scanned elements are reported and the cap does not bite on small pages', opts, async () => {
	const raw = await measureDesignFixture('design-clean.html');
	assert.equal(raw.limits['measure-design.js'].capped, false);
	assert.ok(raw.limits['measure-design.js'].scanned > 10);
});

/** Every object with a `selector` string and a `box` in a derived tree. */
function collectEvidence(node, found = []) {
	if (Array.isArray(node)) node.forEach((n) => collectEvidence(n, found));
	else if (node && typeof node === 'object') {
		if (typeof node.selector === 'string' && node.box) found.push(node);
		Object.values(node).forEach((n) => collectEvidence(n, found));
	}
	return found;
}

test('every reported selector resolves to an element at the reported box', opts, async () => {
	const { finishDesign } = await import('./lib/design.mjs');
	const { withFixture } = await import('./browser-helpers.mjs');
	const { runDesignScripts } = await import('./design-scripts.mjs');
	for (const name of ['design-clean.html', 'design-gestalt-violations.html', 'design-generic-ai.html', 'design-first-viewport.html']) {
		await withFixture(name, async (page) => {
			const { design, tells } = finishDesign(await runDesignScripts(page));
			const evidence = [...collectEvidence(design), ...collectEvidence(tells)];
			assert.ok(evidence.length > 20, `${name}: ${evidence.length} entries`);
			const unresolved = await page.evaluate((items) => {
				const bad = [];
				for (const { selector, box } of items) {
					const el = document.querySelector(selector);
					const r = el && el.getBoundingClientRect();
					const same = r && Math.abs(r.left + scrollX - box.x) <= 1 && Math.abs(r.top + scrollY - box.y) <= 1;
					// Group entries report the union of their members: the selector is the parent, so only existence counts there.
					if (!el || (!same && !(el.contains(document.elementFromPoint(box.x, box.y)) || el.children.length > 1))) bad.push(selector);
				}
				return bad;
			}, evidence.map(({ selector, box }) => ({ selector, box })));
			assert.deepEqual(unresolved, [], `${name}: selectors that do not resolve`);
		});
	}
});

test('false-positive guard: the clean fixture fires no violation list', opts, async () => {
	const { finishDesign } = await import('./lib/design.mjs');
	const { design } = finishDesign(await measureDesignFixture('design-clean.html'));
	assert.deepEqual(design.proximity.violations, []);
	assert.deepEqual(design.proximity.headings.violations, []);
	assert.deepEqual(design.proximity.labels.violations, []);
	assert.deepEqual(design.proximity.groups.violations, []);
	assert.deepEqual(design.region.deep, []);
	assert.equal(design.hierarchy.primaryButtons.count, 1);
	assert.equal(design.firstViewport.weights.nearLargest.competing, false);
});

test('the violation fixture fires all three proximity lists and the generic fixture shows its tells', opts, async () => {
	const { finishDesign } = await import('./lib/design.mjs');
	const bad = finishDesign(await measureDesignFixture('design-gestalt-violations.html')).design;
	assert.equal(bad.proximity.headings.violations.length, 1);
	assert.equal(bad.proximity.labels.violations.length, 1);
	assert.equal(bad.proximity.groups.violations.length, 1);
	assert.equal(bad.region.maxDepth, 4);
	const generic = finishDesign(await measureDesignFixture('design-generic-ai.html'));
	assert.equal(generic.tells.defaultFontsOnly, true);
	assert.ok(generic.design.hierarchy.primaryButtons.count >= 3);
});

test('the page scripts call getComputedStyle at most once per element', opts, async () => {
	const { withFixture } = await import('./browser-helpers.mjs');
	const { designScriptSources } = await import('./design-scripts.mjs');
	await withFixture('design-generic-ai.html', async (page) => {
		for (const { file, source } of designScriptSources()) {
			const repeated = await page.evaluate((src) => {
				const original = window.getComputedStyle;
				const seen = new Map();
				window.getComputedStyle = function (el, ...rest) {
					seen.set(el, (seen.get(el) || 0) + 1);
					return original.call(this, el, ...rest);
				};
				try {
					(0, eval)(src);
				} finally {
					window.getComputedStyle = original;
				}
				return [...seen.values()].filter((n) => n > 1).length;
			}, source);
			assert.equal(repeated, 0, `${file}: elements styled more than once`);
		}
	});
});
