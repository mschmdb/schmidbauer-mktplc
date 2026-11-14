import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finishDesign } from './design.mjs';

const box = { x: 0, y: 0, w: 1, h: 1 };
const emptyRaw = () => ({
	limits: { 'measure-design.js': { total: 0, scanned: 0, capped: false } },
	typography: { families: {}, weights: {}, sizes: {}, mainSizes: {}, h1: null, bodyLineHeights: [], headingLineHeights: [], uppercase: [], justified: [], centered: [] },
	spacing: { histogram: {}, sections: [], sideMargins: [] },
	alignment: { edges: [] },
	proximity: { headings: [], labels: [], groups: [] },
	similarity: { roles: { buttons: [] }, radii: {}, shadows: {} },
	region: { distribution: {}, deep: [] },
	colour: { text: {}, backgrounds: {}, interactive: [] },
	hierarchy: { primaryButtons: [] },
	overflow: { horizontal: false, documentWidth: 1440, viewportWidth: 1440, offenders: [] },
	firstViewport: { width: 1440, height: 900, h1: { present: false, anywhere: false }, weights: [], media: { coveredShare: 0, items: [] }, overlays: [], textOverImage: [] },
	prominence: { candidates: [] },
	tells: {
		gradientText: { count: 0, examples: [] },
		backdropBlur: { count: 0, examples: [] },
		emojiIcons: { count: 0, examples: [] },
		identicalCardGroups: [],
		gradientBackgrounds: { count: 0, colours: [] },
		generator: null,
		builders: { attributes: [], hosts: [] }
	}
});

test('finishDesign derives every part and moves tells out of the design object', () => {
	const { design, tells } = finishDesign(emptyRaw());
	assert.deepEqual(Object.keys(design).sort(), ['alignment', 'colour', 'firstViewport', 'hierarchy', 'limits', 'overflow', 'prominence', 'proximity', 'region', 'similarity', 'spacing', 'typography']);
	assert.equal(design.tells, undefined);
	assert.equal(tells.gradientText, 0);
	assert.equal(tells.defaultFontsOnly, false);
	assert.deepEqual(design.prominence.items, []);
	assert.equal(design.region.maxDepth, 0);
});

test('finishDesign does not modify its input and keeps selectors and boxes of violations', () => {
	const raw = emptyRaw();
	raw.proximity.headings = [{ selector: 'h2', box, tag: 'H2', text: 'A', gapAbove: 4, gapBelow: 20 }];
	const before = JSON.stringify(raw);
	const { design } = finishDesign(raw);
	assert.equal(JSON.stringify(raw), before);
	assert.equal(design.proximity.violations[0].selector, 'h2');
	assert.deepEqual(design.proximity.violations[0].box, box);
});
