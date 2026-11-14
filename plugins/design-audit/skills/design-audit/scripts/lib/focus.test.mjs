import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusIndicator } from './focus.mjs';

const base = {
	outlineStyle: 'none',
	outlineWidth: '0px',
	outlineColor: 'rgb(0, 0, 0)',
	boxShadow: 'none',
	borderColor: 'rgb(153, 153, 153)',
	backgroundColor: 'rgb(255, 255, 255)',
	color: 'rgb(17, 17, 17)',
	textDecorationLine: 'none'
};

test('a solid coloured outline is visible', () => {
	const focused = { ...base, outlineStyle: 'solid', outlineWidth: '3px', outlineColor: 'rgb(26, 115, 232)' };
	assert.deepEqual(focusIndicator(focused, base), { visible: true, via: 'outline' });
});

test('Tailwind outline-none (transparent outline) is not an indicator', () => {
	const focused = { ...base, outlineStyle: 'solid', outlineWidth: '2px', outlineColor: 'rgba(0, 0, 0, 0)' };
	assert.deepEqual(focusIndicator(focused, base), { visible: false, via: 'none' });
});

test('an outline that is already there when unfocused is not a focus indicator', () => {
	const style = { ...base, outlineStyle: 'solid', outlineWidth: '2px', outlineColor: 'rgb(0, 0, 0)' };
	assert.deepEqual(focusIndicator(style, style), { visible: false, via: 'none' });
});

test('a new box-shadow ring counts', () => {
	const focused = { ...base, boxShadow: 'rgb(26, 115, 232) 0px 0px 0px 3px' };
	assert.deepEqual(focusIndicator(focused, base), { visible: true, via: 'box-shadow' });
});

test('a border colour change counts', () => {
	const focused = { ...base, borderColor: 'rgb(221, 0, 0)' };
	assert.deepEqual(focusIndicator(focused, base), { visible: true, via: 'border' });
});

test('background, text colour and underline changes count', () => {
	assert.equal(focusIndicator({ ...base, backgroundColor: 'rgb(0, 0, 0)' }, base).via, 'background');
	assert.equal(focusIndicator({ ...base, color: 'rgb(200, 0, 0)' }, base).via, 'color');
	assert.equal(focusIndicator({ ...base, textDecorationLine: 'underline' }, base).via, 'underline');
});

test('an unparseable outline colour counts as visible rather than hiding a real ring', () => {
	const focused = { ...base, outlineStyle: 'solid', outlineWidth: '2px', outlineColor: 'color(display-p3 1 0 0)' };
	assert.equal(focusIndicator(focused, base).visible, true);
});

test('zero-width outline is not visible', () => {
	const focused = { ...base, outlineStyle: 'solid', outlineWidth: '0px', outlineColor: 'rgb(0, 0, 0)' };
	assert.equal(focusIndicator(focused, base).visible, false);
});
