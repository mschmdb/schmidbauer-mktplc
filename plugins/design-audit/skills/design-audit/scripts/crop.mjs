#!/usr/bin/env node
// Cut an evidence crop from a screenshot, with padding, clamped to the image.
// Usage: node crop.mjs <png> <x> <y> <width> <height> <out.png>
// x, y, width and height are CSS pixels as reported by the design measurements (`box`); screenshots use CSS pixels.
// Prints the region that was cut as JSON. Exit code 2 for wrong arguments, 1 when the box lies outside the image.
import sharp from 'sharp';
import { pathToFileURL } from 'node:url';

/** Padding in px added around the box so the crop shows context (own value). */
export const CROP_PADDING = 16;

/**
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} [padding] px added on every side
 * @returns {{ left: number, top: number, width: number, height: number } | null} integer region inside the image; null when the box has no size, is not a number or lies outside
 */
export function clampCrop(box, imageWidth, imageHeight, padding = CROP_PADDING) {
	const values = [box.x, box.y, box.width, box.height];
	if (values.some((v) => !Number.isFinite(v)) || box.width <= 0 || box.height <= 0) return null;
	const left = Math.max(0, Math.floor(box.x - padding));
	const top = Math.max(0, Math.floor(box.y - padding));
	const right = Math.min(imageWidth, Math.ceil(box.x + box.width + padding));
	const bottom = Math.min(imageHeight, Math.ceil(box.y + box.height + padding));
	if (right <= left || bottom <= top) return null;
	return { left, top, width: right - left, height: bottom - top };
}

/**
 * Write the crop of `box` from `source` to `destination`.
 * @param {string} source PNG path
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {string} destination output PNG path
 * @param {number} [padding]
 * @returns {Promise<{ left: number, top: number, width: number, height: number }>} the region that was cut
 * @throws {Error} when the box lies outside the image
 */
export async function cropRegion(source, box, destination, padding = CROP_PADDING) {
	const { width, height } = await sharp(source).metadata();
	const region = clampCrop(box, width, height, padding);
	if (!region) throw new Error(`Box ${JSON.stringify(box)} lies outside the ${width}x${height} image.`);
	await sharp(source).extract(region).png().toFile(destination);
	return region;
}

async function main(argv) {
	const [source, x, y, w, h, destination] = argv;
	const numbers = [x, y, w, h].map(Number);
	if (!destination || argv.length !== 6 || numbers.some(Number.isNaN)) {
		process.stderr.write('Usage: node crop.mjs <png> <x> <y> <width> <height> <out.png>\n');
		process.exit(2);
	}
	try {
		const region = await cropRegion(source, { x: numbers[0], y: numbers[1], width: numbers[2], height: numbers[3] }, destination);
		process.stdout.write(`${JSON.stringify(region)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
