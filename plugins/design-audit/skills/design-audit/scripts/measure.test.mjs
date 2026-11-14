import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureFixture, skipReason } from './browser-helpers.mjs';
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
	assert.equal(m.smallTargets.total, 3);
	assert.equal(m.smallTargets.failingSpacing, 2);
	assert.equal(m.smallTargets.items.length, 3);
	assert.ok(!m.smallTargets.items.some((i) => /terms|Newsletter/.test(i)));
	assert.ok(m.smallTargets.items.some((i) => /isolated/.test(i) && /spacing ok/.test(i)));
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
