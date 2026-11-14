import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from './retry.mjs';

test('returns the value of the first successful call without retrying', async () => {
	let calls = 0;
	assert.equal(await withRetry(async () => (++calls, 'ok'), { delayMs: 0 }), 'ok');
	assert.equal(calls, 1);
});

test('retries once after a failure and returns the second result', async () => {
	let calls = 0;
	const value = await withRetry(
		async () => {
			if (++calls === 1) throw new Error('flaky');
			return 'second';
		},
		{ delayMs: 0 }
	);
	assert.equal(value, 'second');
	assert.equal(calls, 2);
});

test('throws the second error and stops after one retry', async () => {
	let calls = 0;
	await assert.rejects(
		withRetry(
			async () => {
				throw new Error(`fail ${++calls}`);
			},
			{ delayMs: 0 }
		),
		/fail 2/
	);
	assert.equal(calls, 2);
});
