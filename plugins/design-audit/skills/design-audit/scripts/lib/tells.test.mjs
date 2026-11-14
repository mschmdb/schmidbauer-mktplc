import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTells, onlyDefaultFonts, builderNames } from './tells.mjs';

const box = { x: 0, y: 0, w: 1, h: 1 };
const rawTells = {
	gradientText: { count: 1, examples: [{ selector: 'span', box, text: 'faster' }] },
	backdropBlur: { count: 2, examples: [{ selector: 'div', box }] },
	emojiIcons: { count: 3, examples: [{ selector: 'div', box, text: '🚀' }] },
	identicalCardGroups: [{ selector: 'div', box, count: 3, skeleton: 'div(div,h3,p)' }],
	gradientBackgrounds: { count: 1, colours: ['rgb(99, 102, 241)', 'rgb(139, 92, 246)', 'rgb(217, 70, 239)'] },
	generator: 'Framer',
	builders: { attributes: ['data-framer-root', 'data-wf-page'], hosts: ['app.lovable.dev'] }
};
const similarity = {
	radii: { top: { value: '16px', share: 0.5, count: 4, total: 8, distinct: 3 } },
	shadows: { top: { value: 'rgba(0,0,0,.4) 0px 10px 30px 0px', share: 1, count: 3, total: 3, distinct: 1 } }
};

test('onlyDefaultFonts is true for Inter, Roboto, Arial, Helvetica and system-ui stacks only', () => {
	assert.equal(onlyDefaultFonts(['Inter']), true);
	assert.equal(onlyDefaultFonts(['Inter', 'system-ui', 'Arial']), true);
	assert.equal(onlyDefaultFonts(['Helvetica Neue', 'ui-sans-serif']), true);
	assert.equal(onlyDefaultFonts(['Inter', 'Georgia']), false);
	assert.equal(onlyDefaultFonts([]), false);
});

test('builderNames maps attributes, hosts and the generator to builder names without judging', () => {
	assert.deepEqual(builderNames({ generator: 'Framer', attributes: ['data-framer-root', 'data-wf-page'], hosts: ['app.lovable.dev', 'cdn.v0.dev', 'x.bolt.new'] }), ['bolt', 'framer', 'lovable', 'v0', 'webflow']);
	assert.deepEqual(builderNames({ generator: null, attributes: [], hosts: [] }), []);
	assert.deepEqual(builderNames({ generator: 'WordPress 6.5', attributes: [], hosts: [] }), []);
});

test('deriveTells combines raw page tells with typography and similarity', () => {
	const t = deriveTells(rawTells, { typography: { families: [{ family: 'Inter', chars: 10, share: 1 }] }, similarity });
	assert.equal(t.gradientText, 1);
	assert.equal(t.gradientTextExamples.length, 1);
	assert.equal(t.backdropBlurElements, 2);
	assert.equal(t.emojiIcons, 3);
	assert.deepEqual(t.mostCommonRadius, { value: '16px', share: 0.5, count: 4 });
	assert.deepEqual(t.mostCommonShadow, { value: 'rgba(0,0,0,.4) 0px 10px 30px 0px', share: 1, count: 3 });
	assert.equal(t.identicalCardGroups.length, 1);
	assert.equal(t.gradientBackgrounds, 1);
	assert.ok(t.gradientHues.includes(240) || t.gradientHues.includes(270), JSON.stringify(t.gradientHues));
	assert.equal(t.generator, 'Framer');
	assert.deepEqual(t.builderFingerprints.matched, ['framer', 'lovable', 'webflow']);
	assert.equal(t.defaultFontsOnly, true);
});
