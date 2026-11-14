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
