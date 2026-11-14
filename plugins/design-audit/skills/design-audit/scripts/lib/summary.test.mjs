import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarise } from './summary.mjs';

test('the summary carries paths, notes, the incomplete flag and per-viewport status without measurements', () => {
	const big = { measure: { huge: 'x'.repeat(10000) }, design: {}, status: 200, missing: [] };
	const summary = summarise({ url: 'https://example.test/', incomplete: true, notes: ['mobile: full-page screenshot failed'], desktop: big, mobile: { ...big, measure: null, missing: ['measure'] } }, '/tmp/out');
	assert.equal(summary.auditJson, '/tmp/out/audit.json');
	assert.equal(summary.incomplete, true);
	assert.deepEqual(summary.notes, ['mobile: full-page screenshot failed']);
	assert.deepEqual(summary.viewports.desktop, { status: 200, measured: true, missing: [] });
	assert.deepEqual(summary.viewports.mobile, { status: 200, measured: false, missing: ['measure'] });
	assert.ok(JSON.stringify(summary).length < 600);
});

test('a viewport that never started is null', () => {
	const summary = summarise({ url: 'u', incomplete: true, notes: [], desktop: null, mobile: null }, '/o');
	assert.deepEqual(summary.viewports, { desktop: null, mobile: null });
});
