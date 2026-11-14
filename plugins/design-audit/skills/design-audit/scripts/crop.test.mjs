import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { clampCrop, cropRegion, CROP_PADDING } from './crop.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let dir;
let source;

before(async () => {
	dir = mkdtempSync(join(tmpdir(), 'crop-'));
	source = join(dir, 'in.png');
	await sharp({ create: { width: 200, height: 100, channels: 3, background: '#ffffff' } }).png().toFile(source);
});
after(() => rmSync(dir, { recursive: true, force: true }));

test('clampCrop adds the padding around the box', () => {
	assert.equal(CROP_PADDING, 16);
	assert.deepEqual(clampCrop({ x: 50, y: 40, width: 20, height: 10 }, 200, 100), { left: 34, top: 24, width: 52, height: 42 });
	assert.deepEqual(clampCrop({ x: 50, y: 40, width: 20, height: 10 }, 200, 100, 0), { left: 50, top: 40, width: 20, height: 10 });
});

test('clampCrop keeps the region inside the image', () => {
	assert.deepEqual(clampCrop({ x: 0, y: 0, width: 20, height: 10 }, 200, 100), { left: 0, top: 0, width: 36, height: 26 });
	assert.deepEqual(clampCrop({ x: 190, y: 95, width: 50, height: 50 }, 200, 100), { left: 174, top: 79, width: 26, height: 21 });
	assert.deepEqual(clampCrop({ x: -30, y: -30, width: 40, height: 40 }, 200, 100, 0), { left: 0, top: 0, width: 10, height: 10 });
});

test('clampCrop returns null for a box fully outside the image or with no size', () => {
	assert.equal(clampCrop({ x: 300, y: 10, width: 20, height: 20 }, 200, 100, 0), null);
	assert.equal(clampCrop({ x: 10, y: 10, width: 0, height: 20 }, 200, 100, 0), null);
	assert.equal(clampCrop({ x: Number.NaN, y: 10, width: 5, height: 5 }, 200, 100), null);
});

test('cropRegion writes the clamped region and reports its size', async () => {
	const out = join(dir, 'out.png');
	const region = await cropRegion(source, { x: 190, y: 95, width: 50, height: 50 }, out);
	assert.deepEqual(region, { left: 174, top: 79, width: 26, height: 21 });
	const meta = await sharp(out).metadata();
	assert.deepEqual([meta.width, meta.height], [26, 21]);
});

test('cropRegion rejects a box outside the image', async () => {
	await assert.rejects(() => cropRegion(source, { x: 500, y: 500, width: 10, height: 10 }, join(dir, 'x.png'), 0), /outside/);
});

function run(args) {
	return new Promise((resolve) => execFile('node', [join(here, 'crop.mjs'), ...args], (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr })));
}

test('CLI crops and prints the region as JSON', async () => {
	const out = join(dir, 'cli.png');
	const { code, stdout } = await run([source, '10', '10', '30', '20', out]);
	assert.equal(code, 0);
	assert.deepEqual(JSON.parse(stdout), { left: 0, top: 0, width: 56, height: 46 });
	assert.ok(existsSync(out));
});

test('CLI prints usage and exits 2 for wrong arguments, 1 for a failed crop', async () => {
	const usage = await run([source, '1']);
	assert.equal(usage.code, 2);
	assert.match(usage.stderr, /Usage/);
	const bad = await run([source, '9999', '9999', '10', '10', join(dir, 'z.png')]);
	assert.equal(bad.code, 1);
	assert.match(bad.stderr, /outside/);
	const nan = await run([source, 'a', '1', '1', '1', join(dir, 'n.png')]);
	assert.equal(nan.code, 2);
});
