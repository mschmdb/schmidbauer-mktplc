// End-to-end: run audit.mjs as a child process against a local server.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const auditPath = join(here, 'audit.mjs');

const skip = await chromium
	.launch()
	.then((b) => b.close().then(() => false))
	.catch(() => 'Chromium is not installed. Run: pnpm exec playwright install chromium');

/** @returns {Promise<{ code: number | null, stdout: string, stderr: string }>} */
function runAudit(url, outDir) {
	return new Promise((resolve) => {
		execFile('node', [auditPath, url, outDir], { timeout: 170000, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
			resolve({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout, stderr });
		});
	});
}

test('audit.mjs writes audit.json with desktop and mobile results and the PNG files', { skip, timeout: 180000 }, async () => {
	const html = readFileSync(join(here, 'fixtures', 'site.html'));
	const server = createServer((req, res) => {
		res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
		res.end(html);
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const out = mkdtempSync(join(tmpdir(), 'design-audit-'));
	try {
		const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());
		const url = `http://127.0.0.1:${port}/`;
		const { code } = await runAudit(url, out);
		assert.equal(code, 0);

		const audit = JSON.parse(readFileSync(join(out, 'audit.json'), 'utf8'));
		assert.deepEqual(Object.keys(audit).sort(), ['desktop', 'incomplete', 'mobile', 'notes', 'url']);
		assert.equal(audit.url, url);
		assert.equal(audit.incomplete, false);
		assert.deepEqual([audit.desktop.missing, audit.mobile.missing], [[], []]);
		assert.deepEqual(Object.keys(audit.desktop).sort(), Object.keys(audit.mobile).sort());

		for (const name of ['desktop', 'mobile']) {
			const v = audit[name];
			assert.equal(v.status, 200);
			assert.ok(v.measure.title === 'Fixture site', `${name} measure.title`);
			assert.ok(v.measure.paragraphs.length > 0, `${name} paragraphs`);
			assert.ok(Array.isArray(v.measure.smallTargets.items));
			assert.ok(v.design.typography.bodySize > 0, `${name} design.typography.bodySize`);
			assert.equal(typeof v.measure.tells.gradientText, 'number', `${name} tells merged`);
			assert.ok(v.measure.tells.cardLikeBoxes !== undefined, 'existing tells kept');
			assert.ok(v.pixels.whitespaceShare > 0 && v.pixels.colourfulness >= 0, `${name} pixels`);
			for (const file of [v.pixels.file, v.pixels.greyFile, v.pixels.blurFile]) assert.ok(existsSync(join(out, file)), `${file} exists`);
			assert.equal(v.frames.length, 3);
			assert.ok(v.timing.settledMs >= v.timing.loadMs);
			assert.ok(v.scrollShots.length >= 1 && v.scrollShots.length <= 11);
			for (const file of [v.fullPage, ...v.frames.map((f) => f.file), ...v.scrollShots.map((s) => s.file)]) {
				assert.ok(existsSync(join(out, file)), `${file} exists`);
			}
		}
		assert.ok(Array.isArray(audit.desktop.axe));
		assert.equal(audit.mobile.axe, null);
		assert.match(audit.mobile.userAgent, /iPhone/);
		assert.ok(audit.desktop.viewport.width > audit.mobile.viewport.width);
	} finally {
		server.close();
		rmSync(out, { recursive: true, force: true });
	}
});

test('audit.mjs exits with code 1 for an unreachable URL', { skip, timeout: 180000 }, async () => {
	const out = mkdtempSync(join(tmpdir(), 'design-audit-'));
	try {
		const { code } = await runAudit('http://127.0.0.1:1/', out);
		assert.equal(code, 1);
		const audit = JSON.parse(readFileSync(join(out, 'audit.json'), 'utf8'));
		assert.equal(audit.desktop.measure, null);
		assert.equal(audit.incomplete, true);
		assert.ok(audit.desktop.missing.includes('measure'));
		assert.ok(audit.notes.length > 0);
	} finally {
		rmSync(out, { recursive: true, force: true });
	}
});

test('audit.mjs exits with code 2 and a usage line without arguments', async () => {
	const { code, stderr } = await runAudit('', '');
	assert.equal(code, 2);
	assert.match(stderr, /Usage/);
});
