import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closeBrowser, measureDesignFixture, skipReason } from './browser-helpers.mjs';
import { deriveProximity } from './lib/proximity.mjs';

after(closeBrowser);
const opts = { skip: skipReason };

test('proximity: violation fixture flags heading, label and sibling group', opts, async () => {
	const p = deriveProximity((await measureDesignFixture('design-gestalt-violations.html')).proximity);
	const kinds = p.violations.map((v) => v.kind);
	assert.deepEqual(kinds.sort(), ['group', 'heading', 'label']);
	const heading = p.headings.violations[0];
	assert.equal(heading.text, 'Pricing');
	assert.equal(heading.gapAbove, 13, 'margins collapse to the larger 13 px');
	assert.equal(heading.gapBelow, 40);
	const label = p.labels.violations[0];
	assert.equal(label.text, 'Last name');
	assert.equal(label.ownGap, 24);
	assert.equal(label.otherGap, 4);
	const group = p.groups.violations[0];
	assert.equal(group.count, 3);
	assert.equal(group.inner, 40);
	assert.equal(group.outer, 16);
	assert.equal(group.ratio, 0.4);
	assert.ok(group.box.w > 0 && group.selector.length > 0);
});

test('proximity: clean fixture fires no violation list and reports the card ratio', opts, async () => {
	const p = deriveProximity((await measureDesignFixture('design-clean.html')).proximity);
	assert.deepEqual(p.violations, []);
	assert.ok(p.headings.items.length >= 5);
	assert.equal(p.labels.items.length, 2);
	const cards = p.groups.items.find((g) => g.count === 3);
	assert.equal(cards.inner, 16);
	assert.equal(cards.outer, 24);
	assert.equal(cards.ratio, 1.5);
});

test('proximity: a heading that starts its container has no gap above', opts, async () => {
	const raw = await measureDesignFixture('design-clean.html');
	const h1 = raw.proximity.headings.find((h) => h.tag === 'H1');
	assert.equal(h1.gapAbove, null);
	assert.equal(h1.gapBelow, 24);
});
