import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMonoFamily, countMonoElements } from './fonts.mjs';

test('detects common monospace families by first family', () => {
	for (const f of [
		'monospace',
		'ui-monospace',
		'"SF Mono"',
		'Menlo',
		'Monaco',
		'Consolas',
		'"Courier New"',
		'"JetBrains Mono"',
		'"Geist Mono"',
		'"IBM Plex Mono"',
		'"Fira Code"',
		'"Source Code Pro"',
		'Inconsolata',
		'"Cascadia Code"'
	]) {
		assert.equal(isMonoFamily(f), true, f);
	}
});

test('does not flag proportional families', () => {
	for (const f of ['Inter', '"Helvetica Neue"', 'Georgia', 'system-ui', '"Monotype Corsiva"', 'Hackney Sans']) {
		assert.equal(isMonoFamily(f), false, f);
	}
});

test('sums element counts of mono families', () => {
	assert.equal(countMonoElements({ Inter: 40, '"JetBrains Mono"': 5, monospace: 2 }), 7);
	assert.equal(countMonoElements({}), 0);
});
