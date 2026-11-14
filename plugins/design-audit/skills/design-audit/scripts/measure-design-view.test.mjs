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
