import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { analyzePixels, colourfulness, edgeDensity, whitespaceShare, writeGreyscale, writeBlurred, EDGE_THRESHOLD, WHITESPACE_DISTANCE } from './pixels.mjs';

let dir;
const files = {};

/** Build a w x h RGB PNG from a pixel function. */
async function png(name, w, h, pixel) {
	const data = Buffer.alloc(w * h * 3);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) data.set(pixel(x, y), (y * w + x) * 3);
	}
	const file = join(dir, `${name}.png`);
	await sharp(data, { raw: { width: w, height: h, channels: 3 } }).png().toFile(file);
	files[name] = file;
}

before(async () => {
	dir = mkdtempSync(join(tmpdir(), 'pixels-'));
	await png('grey', 40, 40, (x) => [x * 6, x * 6, x * 6]);
	await png('white', 40, 40, () => [255, 255, 255]);
	await png('redblue', 40, 40, (x) => (x < 20 ? [255, 0, 0] : [0, 0, 255]));
	await png('split', 40, 40, (x) => (x < 20 ? [0, 0, 0] : [255, 255, 255]));
	// 2 px bands: a 1 px checkerboard cancels out in the Sobel kernel, 2 px bands do not.
	await png('stripes', 40, 40, (x) => (Math.floor(x / 2) % 2 ? [0, 0, 0] : [255, 255, 255]));
	await png('quarter', 40, 40, (x, y) => (x < 20 && y < 20 ? [0, 0, 0] : [250, 250, 250]));
});
after(() => rmSync(dir, { recursive: true, force: true }));

test('constants are documented fixed values', () => {
	assert.equal(EDGE_THRESHOLD, 128);
	assert.equal(WHITESPACE_DISTANCE, 12);
});

test('colourfulness: a grey image scores about 0, a saturated two-colour image scores high', async () => {
	assert.ok((await colourfulness(files.grey)) < 0.5);
	assert.equal(await colourfulness(files.white), 0);
	const m = await colourfulness(files.redblue);
	// sqrt(127.5^2 + 191.25^2) + 0.3 * sqrt(127.5^2 + 63.75^2) = 272.4
	assert.ok(Math.abs(m - 272.4) < 1.5, `M ${m}`);
});

test('edge density: flat is 0, a single vertical edge touches two columns, 2 px stripes are nearly all edge', async () => {
	assert.equal(await edgeDensity(files.white), 0);
	const split = await edgeDensity(files.split);
	assert.ok(Math.abs(split - 2 / 38) < 0.001, `split ${split}`);
	assert.ok((await edgeDensity(files.stripes)) > 0.9);
	assert.ok((await edgeDensity(files.grey)) === 0, 'a slow gradient stays under the threshold');
});

test('whitespace share: share of pixels near the dominant background colour', async () => {
	assert.equal(await whitespaceShare(files.white), 1);
	assert.equal(await whitespaceShare(files.quarter), 0.75);
	assert.equal(await whitespaceShare(files.redblue), 0.5);
});

test('analyzePixels returns all measures and the size', async () => {
	const a = await analyzePixels(files.quarter);
	assert.deepEqual(Object.keys(a).sort(), ['colourfulness', 'edgeDensity', 'height', 'whitespaceShare', 'width']);
	assert.equal(a.width, 40);
	assert.equal(a.whitespaceShare, 0.75);
});

test('writeGreyscale writes an image whose channels are equal', async () => {
	const out = join(dir, 'g.png');
	await writeGreyscale(files.redblue, out);
	assert.ok(existsSync(out));
	const { data, info } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	assert.equal(info.width, 40);
	for (let i = 0; i < data.length; i += 3) assert.ok(data[i] === data[i + 1] && data[i + 1] === data[i + 2]);
	assert.equal(await colourfulness(out), 0);
});

test('writeBlurred softens edges and keeps the size', async () => {
	const out = join(dir, 'b.png');
	await writeBlurred(files.stripes, out, 2);
	const meta = await sharp(out).metadata();
	assert.equal(meta.width, 40);
	assert.ok((await edgeDensity(out)) < (await edgeDensity(files.stripes)));
});

test('a missing file rejects with a readable error', async () => {
	await assert.rejects(() => analyzePixels(join(dir, 'missing.png')), /missing\.png/);
});
