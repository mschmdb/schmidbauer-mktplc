import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureDesignFixture, skipReason } from './browser-helpers.mjs';
import { deriveHierarchy, deriveFirstViewport } from './lib/hierarchy.mjs';

after(closeBrowser);
const opts = { skip: skipReason };
const viewport = { viewport: { width: 1000, height: 600 } };

test('hierarchy: filled buttons count, transparent, ghost and tiny ones do not', opts, async () => {
	const raw = await measureDesignFixture('design-first-viewport.html', viewport);
	const h = deriveHierarchy(raw.hierarchy);
	assert.deepEqual(h.primaryButtons.items.map((b) => b.label).sort(), ['Accept', 'Buy', 'Subscribe']);
	assert.ok(h.primaryButtons.items.every((b) => b.box.h >= 24 && b.selector));
});

test('hierarchy: clean fixture has one primary button in the first viewport, generic has three', opts, async () => {
	const clean = deriveHierarchy((await measureDesignFixture('design-clean.html')).hierarchy);
	assert.equal(clean.primaryButtons.count, 1);
	assert.equal(clean.primaryButtons.items[0].label, 'Start a project');
	const generic = deriveHierarchy((await measureDesignFixture('design-generic-ai.html')).hierarchy);
	assert.ok(generic.primaryButtons.count >= 3, `count ${generic.primaryButtons.count}`);
});

test('first viewport: h1, media share, overlay, text over image and near-largest weights', opts, async () => {
	const f = deriveFirstViewport((await measureDesignFixture('design-first-viewport.html', viewport)).firstViewport);
	assert.equal(f.h1.present, true);
	assert.equal(f.h1.fontSize, 48);
	assert.equal(f.h1.words, 5);
	assert.ok(Math.abs(f.media.coveredShare - 0.8) < 0.02, 'hero 1000x400 plus img 400x200 on 1000x600: '+ `media ${f.media.coveredShare}`);
	assert.ok(f.media.items.some((i) => i.kind === 'img') && f.media.items.some((i) => i.kind === 'background-image'));
	assert.equal(f.overlays.length, 1);
	assert.equal(f.overlays[0].position, 'fixed');
	assert.ok(f.overlays[0].areaShare > 0.1);
	assert.ok(f.textOverImage.filter((t) => t.via === 'background-image').length >= 3, 'hero heading, line and paragraph');
	assert.ok(f.textOverImage.some((t) => t.via === 'overlap'), 'cookie text lies over the img');
	assert.equal(f.weights.nearLargest.competing, true, 'h1 and h2 are close in size');
	assert.deepEqual(f.weights.nearLargest.items.slice(0, 2).map((i) => i.label.slice(0, 7)), ['Primary', 'Second ']);
});

test('first viewport: a second h1 below the fold is not "present"; clean page has no media or overlay', opts, async () => {
	const clean = deriveFirstViewport((await measureDesignFixture('design-clean.html')).firstViewport);
	assert.equal(clean.h1.present, true);
	assert.equal(clean.media.coveredShare, 0);
	assert.deepEqual(clean.overlays, []);
	assert.deepEqual(clean.textOverImage, []);
	assert.equal(clean.weights.nearLargest.competing, false);
});

test('prominence: the hero heading ranks first on the fixture and every entry has a selector and a box', opts, async () => {
	const { rankProminence } = await import('./lib/prominence.mjs');
	const raw = await measureDesignFixture('design-first-viewport.html', viewport);
	const r = rankProminence(raw.prominence.candidates, { width: 1000, height: 600 });
	assert.equal(r.items[0].label, 'Primary promise in the hero');
	assert.ok(r.items.length <= 8 && r.items.length >= 4);
	for (const item of r.items) assert.ok(item.selector && item.box.w > 0 && item.score > 0);
	assert.match(r.method, /prediction/);
});

test('prominence: on the clean page the h1 leads and only the filled link counts as a button', opts, async () => {
	const { rankProminence } = await import('./lib/prominence.mjs');
	const raw = await measureDesignFixture('design-clean.html');
	const view = { width: 1280, height: 800 };
	assert.match(rankProminence(raw.prominence.candidates, view).items[0].label, /Quiet interfaces/);
	const byLabel = (text) => raw.prominence.candidates.find((c) => c.label === text);
	assert.equal(byLabel('Start a project').kind, 'button');
	assert.equal(byLabel('See our work').kind, 'text', 'outlined: no fill');
});

test('prominence: a filled primary button outranks an outlined secondary one of equal size', opts, async () => {
	const { rankProminence } = await import('./lib/prominence.mjs');
	const raw = await measureDesignFixture('prominence-buttons.html', viewport);
	const items = rankProminence(raw.prominence.candidates, { width: 1000, height: 600 }).items;
	const rank = (text) => items.find((i) => i.label === text).rank;
	assert.ok(rank('Filled') < rank('Outlined'), `filled ${rank('Filled')}, outlined ${rank('Outlined')}`);
});

test('tells: generic fixture shows gradient text, glass, emoji icons, identical cards and builder fingerprints', opts, async () => {
	const { deriveTells } = await import('./lib/tells.mjs');
	const { deriveTypography } = await import('./lib/typography.mjs');
	const { deriveSimilarity } = await import('./lib/similarity.mjs');
	const raw = await measureDesignFixture('design-generic-ai.html');
	const t = deriveTells(raw.tells, { typography: deriveTypography(raw.typography), similarity: deriveSimilarity(raw.similarity) });
	assert.equal(t.gradientText, 1);
	assert.equal(t.gradientTextExamples[0].text, 'faster than ever');
	assert.equal(t.backdropBlurElements, 1);
	assert.equal(t.emojiIcons, 3);
	assert.equal(t.identicalCardGroups.length, 1);
	assert.equal(t.identicalCardGroups[0].count, 3);
	assert.equal(t.gradientBackgrounds, 1);
	assert.ok(t.gradientHues.some((h) => h >= 240 && h <= 330), `hues ${t.gradientHues}`);
	assert.equal(t.mostCommonShadow.share, 1);
	assert.ok(t.mostCommonRadius.share >= 0.4, `radius ${JSON.stringify(t.mostCommonRadius)}`);
	assert.equal(t.generator, 'Framer');
	assert.deepEqual(t.builderFingerprints.matched, ['framer', 'lovable']);
	assert.ok(t.builderFingerprints.attributes.includes('data-framer-root'));
	assert.deepEqual(t.builderFingerprints.hosts, ['app.lovable.dev']);
	assert.equal(t.defaultFontsOnly, true);
});

test('tells: clean fixture shows none of the new tells', opts, async () => {
	const { deriveTells } = await import('./lib/tells.mjs');
	const { deriveTypography } = await import('./lib/typography.mjs');
	const { deriveSimilarity } = await import('./lib/similarity.mjs');
	const raw = await measureDesignFixture('design-clean.html');
	const t = deriveTells(raw.tells, { typography: deriveTypography(raw.typography), similarity: deriveSimilarity(raw.similarity) });
	assert.equal(t.gradientText, 0);
	assert.equal(t.backdropBlurElements, 0);
	assert.equal(t.emojiIcons, 0);
	assert.deepEqual(t.identicalCardGroups, [], 'the third card has an extra box');
	assert.equal(t.gradientBackgrounds, 0);
	assert.equal(t.generator, null);
	assert.deepEqual(t.builderFingerprints.matched, []);
	assert.equal(t.defaultFontsOnly, false);
});

test('late content: a heading revealed after 1500 ms is reported against the 1000 ms snapshot', opts, async () => {
	const { finishDesign } = await import('./lib/design.mjs');
	const { withFixture } = await import('./browser-helpers.mjs');
	const { runDesignScripts } = await import('./design-scripts.mjs');
	const { readFileSync } = await import('node:fs');
	const snapshotSource = readFileSync(new URL('./snapshot-first-viewport.js', import.meta.url), 'utf8');
	await withFixture('late-content.html', async (page) => {
		await page.waitForTimeout(1000);
		const earlySnapshot = await page.evaluate(snapshotSource);
		await page.waitForTimeout(900);
		const { design } = finishDesign(await runDesignScripts(page), { earlySnapshot });
		const late = design.firstViewport.lateContent;
		assert.equal(late.referenceMs, 1000);
		assert.equal(late.count, 1);
		assert.equal(late.items[0].label, 'Revealed after 1500 ms');
		assert.equal(late.items[0].selector, '#late');
		assert.ok(late.items[0].box.w > 0);
		const noSnapshot = finishDesign(await runDesignScripts(page)).design.firstViewport.lateContent;
		assert.equal(noSnapshot, null);
	}, viewport);
});

const mobile = { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };

test('overflow: mobile emulation widens innerWidth, so first-viewport data uses the configured size', opts, async () => {
	const { withFixture, measureSource } = await import('./browser-helpers.mjs');
	const { evaluateAtViewport } = await import('./lib/viewport.mjs');
	const { runDesignScripts } = await import('./design-scripts.mjs');
	await withFixture('overflow.html', async (page) => {
		const inner = await page.evaluate(() => window.innerWidth);
		assert.ok(inner > 390, `innerWidth ${inner} shows the widened layout viewport`);
		const raw = await runDesignScripts(page);
		assert.equal(raw.firstViewport.width, 390);
		assert.equal(raw.firstViewport.height, 664);
		assert.equal((await evaluateAtViewport(page, measureSource)).firstViewport.viewport, '390x664');
	}, mobile);
});

test('overflow: reports offenders past the configured width and skips scroll containers and fixed boxes', opts, async () => {
	const raw = await measureDesignFixture('overflow.html', mobile);
	const o = raw.overflow;
	assert.equal(o.horizontal, true);
	assert.equal(o.viewportWidth, 390);
	assert.ok(o.documentWidth >= 900);
	assert.ok(o.offenders.length >= 1 && o.offenders.length <= 8);
	assert.ok(o.offenders.some((x) => x.selector.includes('wide') && x.label.startsWith('A box') && x.box.w === 900));
	assert.ok(o.offenders.every((x) => !x.selector.includes('track') && !/fixed|Off-canvas/.test(x.label)));
});

test('overflow: a clean fixture reports no horizontal overflow, and design.overflow reaches the derived tree', opts, async () => {
	const { finishDesign } = await import('./lib/design.mjs');
	const { withFixture } = await import('./browser-helpers.mjs');
	const { runDesignScripts } = await import('./design-scripts.mjs');
	await withFixture('design-clean.html', async (page) => {
		const { design } = finishDesign(await runDesignScripts(page));
		assert.equal(design.overflow.horizontal, false);
		assert.deepEqual(design.overflow.offenders, []);
		assert.equal(design.overflow.viewportWidth, 1280);
	});
});

test('overflow: the offender list is capped at eight', opts, async () => {
	const { withFixture } = await import('./browser-helpers.mjs');
	const { runDesignScripts } = await import('./design-scripts.mjs');
	await withFixture('overflow.html', async (page) => {
		await page.evaluate(() => {
			for (let i = 0; i < 20; i++) {
				const d = document.createElement('div');
				d.style.cssText = 'width:700px;height:10px';
				d.textContent = `extra ${i}`;
				document.body.append(d);
			}
		});
		assert.equal((await runDesignScripts(page)).overflow.offenders.length, 8);
	}, mobile);
});

test('hierarchy: image links, translucent map controls, icon toggles and pressed toggles are no primary buttons; a link styled as button is', opts, async () => {
	const h = deriveHierarchy((await measureDesignFixture('buttons-patterns.html')).hierarchy);
	assert.deepEqual(h.primaryButtons.items.map((b) => b.label), ['Book a call']);
});

test('late content: an image and a background image that load after 1500 ms are reported as media', opts, async () => {
	const { finishDesign } = await import('./lib/design.mjs');
	const { withFixture } = await import('./browser-helpers.mjs');
	const { runDesignScripts } = await import('./design-scripts.mjs');
	const { readFileSync } = await import('node:fs');
	const snapshotSource = readFileSync(new URL('./snapshot-first-viewport.js', import.meta.url), 'utf8');
	await withFixture('late-media.html', async (page) => {
		await page.waitForTimeout(1000);
		const earlySnapshot = await page.evaluate(snapshotSource);
		await page.waitForTimeout(900);
		const { design } = finishDesign(await runDesignScripts(page), { earlySnapshot });
		const late = design.firstViewport.lateContent;
		assert.equal(late.count, 0, 'no late text');
		assert.deepEqual(late.media.items.map((m) => m.selector), ['#late-img', '#late-bg']);
		assert.deepEqual(late.media.items.map((m) => m.kind), ['img', 'background-image']);
		assert.ok(late.media.items.every((m) => m.box.w === 100));
	}, viewport);
});
