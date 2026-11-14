import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureFixture, skipReason, withFixture } from './browser-helpers.mjs';
import { finishMeasure } from './lib/post.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('cardLikeBoxes ignores preflight borders and transparent boxes (item 1)', opts, async () => {
	const m = await measureFixture('cards-preflight.html');
	assert.equal(m.tells.cardLikeBoxes, 3);
});

test('text counts skip opacity 0, sr-only, off-screen and aria-hidden text (item 2)', opts, async () => {
	const m = await measureFixture('hidden-text.html');
	assert.deepEqual(Object.keys(m.sizes), ['18px']);
});

test('smallTargets skips inline text links and hidden inputs, tests spacing, reports a total (item 5)', opts, async () => {
	const m = await measureFixture('targets.html');
	// 3 icon buttons plus 2 adjacent nav links (links among other links are not "in text")
	assert.equal(m.smallTargets.total, 5);
	// The wide nav links pass the 24 px circle test; only the two 16 px buttons 2 px apart fail.
	assert.equal(m.smallTargets.failingSpacing, 2);
	assert.equal(m.smallTargets.items.length, 5);
	assert.ok(m.smallTargets.items.some((i) => /Home/.test(i.label)));
	assert.ok(!m.smallTargets.items.some((i) => /terms|Newsletter/.test(i.label)));
	assert.ok(m.smallTargets.items.some((i) => /isolated/.test(i.label) && i.spacingOk));
	for (const item of m.smallTargets.items) {
		assert.ok(item.selector && item.tag && item.box.w > 0 && item.box.h > 0, JSON.stringify(item));
	}
	const counts = await withFixture('targets.html', (page) => Promise.all(m.smallTargets.items.map((i) => page.locator(i.selector).count())));
	assert.deepEqual(counts, m.smallTargets.items.map(() => 1), 'every selector resolves to one element');
	const left = m.smallTargets.items.find((i) => i.label === 'left');
	assert.deepEqual([left.box.w, left.box.h, left.spacingOk], [16, 16, false]);
});

test('paragraphs measure real characters per line inside main content only (item 6)', opts, async () => {
	const m = await measureFixture('line-length.html');
	assert.equal(m.paragraphs.length, 1);
	const p = m.paragraphs[0];
	assert.ok(p.lines > 3, `lines: ${p.lines}`);
	assert.ok(p.charsPerLine >= 34 && p.charsPerLine <= 41, `charsPerLine: ${p.charsPerLine}`);
	assert.ok(p.charsPerLineMax >= p.charsPerLine);
	assert.equal(p.charsPerLineEstimate, undefined);
});

test('numbered markers skip dates, arrows count only link and button labels, mono skips code (item 8)', opts, async () => {
	const m = await measureFixture('tells.html');
	assert.equal(m.tells.numberedMarkers, 3);
	assert.equal(m.tells.arrowSuffixes, 2);
	const out = finishMeasure(m);
	assert.equal(out.tells.monoTextElements, 3);
});

test('repeated phrases ignore nav, footer and hidden text (item 9)', opts, async () => {
	const out = finishMeasure(await measureFixture('tells.html'));
	assert.deepEqual(out.repeated, []);
	assert.equal(out.contentText, undefined);
});

test('paragraphs measure text blocks: p, and li with running text only; headings, grid rows, card items and svg text stay out', opts, async () => {
	const m = await measureFixture('paragraphs.html');
	assert.deepEqual(m.paragraphs.map((p) => p.selector), ['#body-p', '#run-li', '#card-p', '#svg-li']);
	assert.ok(m.paragraphs.every((p) => p.box.w > 0 && p.box.h > 0), 'every entry has a box');
	const byId = Object.fromEntries(m.paragraphs.map((p) => [p.selector, p]));
	assert.ok(byId['#card-p'].charsPerLine >= 30, `card text alone: ${byId['#card-p'].charsPerLine}`);
	assert.ok(byId['#svg-li'].charsPerLineMax <= 61, `svg text is not a line of the item: ${byId['#svg-li'].charsPerLineMax}`);
	assert.equal(byId['#body-p'].text.startsWith('Running text'), true);
});
