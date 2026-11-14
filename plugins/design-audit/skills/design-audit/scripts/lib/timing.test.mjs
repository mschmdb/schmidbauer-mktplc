import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeBusy, lateFrameNotes } from './timing.mjs';

test('a frame more than 200 ms after its target gets a note with the real time', () => {
	const notes = lateFrameNotes('desktop', [
		{ targetMs: 300, atMs: 940 },
		{ targetMs: 1000, atMs: 1180 },
		{ targetMs: 2500, atMs: 2700 }
	]);
	assert.equal(notes.length, 1);
	assert.match(notes[0], /^desktop: t300 captured at 940 ms, 640 ms after its target/);
});

test('frames on time give no note', () => {
	assert.deepEqual(lateFrameNotes('mobile', [{ targetMs: 300, atMs: 301 }]), []);
});

test('describeBusy lists pending requests, animations and the last DOM change', () => {
	const text = describeBusy({ pendingRequests: 1, runningAnimations: 3, infiniteAnimations: 2, lastMutation: 'svg#logo', fontsReady: true, quiet: false });
	assert.equal(text, 'last DOM change in svg#logo, 1 pending request, 3 running animations (2 endless)');
});

test('describeBusy names fonts that never became ready', () => {
	const text = describeBusy({ pendingRequests: 0, runningAnimations: 0, infiniteAnimations: 0, lastMutation: null, fontsReady: false, quiet: true });
	assert.equal(text, 'web fonts not ready, 0 pending requests, 0 running animations (0 endless)');
});
