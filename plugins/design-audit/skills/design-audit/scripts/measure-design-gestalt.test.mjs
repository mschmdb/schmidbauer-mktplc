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

test('similarity: three button styles show up as three variants that differ in radius, fill and weight', opts, async () => {
	const { deriveSimilarity } = await import('./lib/similarity.mjs');
	const s = deriveSimilarity((await measureDesignFixture('design-gestalt-violations.html')).similarity);
	assert.equal(s.roles.buttons.total, 3);
	assert.equal(s.roles.buttons.distinct, 3);
	for (const prop of ['radius', 'background', 'fontWeight', 'shadow']) assert.ok(s.roles.buttons.differsIn.includes(prop), prop);
	assert.ok(s.roles.buttons.variants[0].sample.selector.length > 0);
});

test('similarity: clean fixture has consistent cards, links and headings; radii and shadows are counted', opts, async () => {
	const { deriveSimilarity } = await import('./lib/similarity.mjs');
	const s = deriveSimilarity((await measureDesignFixture('design-clean.html')).similarity);
	assert.equal(s.roles.cards.distinct, 1, 'three cards, one style');
	assert.equal(s.roles.cards.total, 3);
	assert.equal(s.roles.h2.distinct, 1);
	assert.equal(s.roles.links.total, 1, 'only the link inside the sentence');
	assert.equal(s.roles.buttons.total, 3, 'primary, secondary and submit');
	assert.ok(s.radii.distinct >= 1 && s.radii.top.value === '8px');
	assert.equal(s.shadows.distinct, 0);
});

test('region: the four nested bordered boxes give depth 4, the clean page at most 2', opts, async () => {
	const { deriveRegion } = await import('./lib/similarity.mjs');
	const bad = deriveRegion((await measureDesignFixture('design-gestalt-violations.html')).region);
	assert.equal(bad.maxDepth, 4);
	assert.equal(bad.deep[0].depth, 4);
	assert.equal(bad.deep[0].selector, '#deep4');
	const clean = deriveRegion((await measureDesignFixture('design-clean.html')).region);
	assert.equal(clean.maxDepth, 2);
	assert.deepEqual(clean.deep, []);
});

test('colour: generic fixture has purple hues; clean fixture has one blue accent on its primary buttons', opts, async () => {
	const { deriveColour } = await import('./lib/colour.mjs');
	const generic = deriveColour((await measureDesignFixture('design-generic-ai.html')).colour);
	assert.ok(generic.backgrounds.families.length >= 2, JSON.stringify(generic.backgrounds.families.map((f) => f.hue)));
	assert.ok(generic.accentHues.length >= 2);
	const clean = deriveColour((await measureDesignFixture('design-clean.html')).colour);
	assert.deepEqual(clean.accentHues, [240]);
	assert.ok(clean.accents[0].count >= 2, 'primary link button and submit button');
	assert.ok(clean.text.neutralShare > 0.9);
	assert.ok(clean.lightness.buttonBackground.n >= 1);
	assert.ok(clean.accents[0].sample.selector.length > 0);
});

test('proximity: eyebrows, bylines, date lines, rules, page sections and one-row groups do not fire; a real violation still does', opts, async () => {
	const p = deriveProximity((await measureDesignFixture('design-proximity-patterns.html')).proximity);
	const found = p.violations.map((v) => (v.kind === 'heading' ? `heading ${v.text}` : `${v.kind} ${v.signature}`));
	assert.deepEqual(found, ['heading Real violation', 'group div.rc']);
	const real = p.headings.items.find((h) => h.text === 'Real violation');
	assert.equal(real.gapAbove, 12);
	assert.equal(real.gapBelow, 40);
	const grid = p.groups.items.find((g) => g.signature === 'div.rc');
	assert.deepEqual([grid.count, grid.rows, grid.inner, grid.outer], [4, 2, 40, 16]);
});

test('proximity: a kicker joins its heading; the gap above is measured from the kicker and decorative rules are skipped', opts, async () => {
	const p = deriveProximity((await measureDesignFixture('design-proximity-patterns.html')).proximity);
	const h1 = p.headings.items.find((h) => h.tag === 'H1');
	assert.equal(h1.kicker.text, 'Maintained by one person since 2019');
	assert.equal(h1.gapAbove, null, 'nothing above the byline');
	assert.equal(h1.gapBelow, 32);
	const date = p.headings.items.find((h) => h.text === 'Berlin in squares');
	assert.equal(date.kicker.text, '7 November 2026');
	const band = p.headings.items.find((h) => h.text === 'Reports that answer one question');
	assert.equal(band.kicker.text, 'Patent intelligence');
	assert.equal(band.gapBelow, 68, '16 px, a 4 px rule that is ignored, and 48 px');
	const projects = p.headings.items.find((h) => h.text === 'Projects');
	assert.equal(projects.kicker, null);
});

test('proximity: page sections are no sibling group, a single row needs three items and ignores its own row label', opts, async () => {
	const p = deriveProximity((await measureDesignFixture('design-proximity-patterns.html')).proximity);
	assert.equal(p.groups.items.some((g) => g.signature.startsWith('section')), false);
	const row = p.groups.items.find((g) => g.signature === 'a');
	assert.deepEqual([row.count, row.rows, row.inner, row.outer], [3, 1, 16, 40]);
});
