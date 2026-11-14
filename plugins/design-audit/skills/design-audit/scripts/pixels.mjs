// Pixel measurements on a screenshot (sharp): colourfulness, edge density, whitespace share,
// plus a greyscale copy and a blurred copy for the hierarchy check (H2, C5, S2).
// All thresholds are fixed values of this rule set, not conventions.
import sharp from 'sharp';
import { basename, join } from 'node:path';

/** Sobel magnitude (0 to 1020 on 0 to 255 greyscale) above which a pixel counts as edge. A 32 level step gives 128. */
export const EDGE_THRESHOLD = 128;
/** RGB distance (Euclidean, 0 to 441) from the dominant colour within which a pixel counts as whitespace. */
export const WHITESPACE_DISTANCE = 12;
/** Gaussian sigma in px of the blurred copy: letters melt, blocks stay (squint test). */
export const BLUR_SIGMA = 8;

/**
 * @typedef {Object} Rgb
 * @property {Buffer} data packed R, G, B bytes, alpha flattened onto white
 * @property {number} width
 * @property {number} height
 */

/**
 * Decode a PNG into packed RGB.
 * @param {string} path
 * @returns {Promise<Rgb>}
 */
export async function readRgb(path) {
	try {
		const { data, info } = await sharp(path).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		return { data, width: info.width, height: info.height };
	} catch (error) {
		throw new Error(`Cannot read image ${path}: ${error.message}`);
	}
}

/**
 * Colourfulness after Hasler and Süsstrunk (2003): rg = R - G, yb = 0.5 (R + G) - B,
 * M = sqrt(sd_rg^2 + sd_yb^2) + 0.3 sqrt(mean_rg^2 + mean_yb^2). 0 for grey, about 100 for vivid photos.
 * @param {Rgb} rgb
 * @returns {number}
 */
export function colourfulnessOf({ data, width, height }) {
	const n = width * height;
	let sumRg = 0, sumYb = 0, sqRg = 0, sqYb = 0;
	for (let i = 0; i < data.length; i += 3) {
		const rg = data[i] - data[i + 1];
		const yb = 0.5 * (data[i] + data[i + 1]) - data[i + 2];
		sumRg += rg;
		sumYb += yb;
		sqRg += rg * rg;
		sqYb += yb * yb;
	}
	const meanRg = sumRg / n;
	const meanYb = sumYb / n;
	const sdRg = Math.sqrt(Math.max(0, sqRg / n - meanRg * meanRg));
	const sdYb = Math.sqrt(Math.max(0, sqYb / n - meanYb * meanYb));
	return Math.hypot(sdRg, sdYb) + 0.3 * Math.hypot(meanRg, meanYb);
}

/**
 * Share of interior pixels whose Sobel magnitude on the greyscale image exceeds EDGE_THRESHOLD.
 * @param {Rgb} rgb
 * @returns {number} 0 to 1
 */
export function edgeDensityOf({ data, width, height }) {
	if (width < 3 || height < 3) return 0;
	const grey = new Float32Array(width * height);
	for (let i = 0, p = 0; i < data.length; i += 3, p++) grey[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
	let edges = 0;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const at = (dx, dy) => grey[(y + dy) * width + x + dx];
			const gx = at(1, -1) + 2 * at(1, 0) + at(1, 1) - at(-1, -1) - 2 * at(-1, 0) - at(-1, 1);
			const gy = at(-1, 1) + 2 * at(0, 1) + at(1, 1) - at(-1, -1) - 2 * at(0, -1) - at(1, -1);
			if (Math.hypot(gx, gy) > EDGE_THRESHOLD) edges++;
		}
	}
	return edges / ((width - 2) * (height - 2));
}

/**
 * Share of pixels within WHITESPACE_DISTANCE of the dominant colour. The dominant colour is the mean of the
 * fullest bucket of a 5 bit per channel histogram.
 * @param {Rgb} rgb
 * @returns {number} 0 to 1
 */
export function whitespaceShareOf({ data, width, height }) {
	const counts = new Uint32Array(32768);
	const sums = new Float64Array(32768 * 3);
	for (let i = 0; i < data.length; i += 3) {
		const bucket = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
		counts[bucket]++;
		sums[bucket * 3] += data[i];
		sums[bucket * 3 + 1] += data[i + 1];
		sums[bucket * 3 + 2] += data[i + 2];
	}
	let best = 0;
	for (let b = 1; b < counts.length; b++) if (counts[b] > counts[best]) best = b;
	const [r, g, bl] = [sums[best * 3] / counts[best], sums[best * 3 + 1] / counts[best], sums[best * 3 + 2] / counts[best]];
	let near = 0;
	for (let i = 0; i < data.length; i += 3) {
		if (Math.hypot(data[i] - r, data[i + 1] - g, data[i + 2] - bl) <= WHITESPACE_DISTANCE) near++;
	}
	return near / (width * height);
}

/** @param {string} path PNG path @returns {Promise<number>} Hasler and Süsstrunk colourfulness */
export async function colourfulness(path) {
	return colourfulnessOf(await readRgb(path));
}

/** @param {string} path PNG path @returns {Promise<number>} edge density 0 to 1 */
export async function edgeDensity(path) {
	return edgeDensityOf(await readRgb(path));
}

/** @param {string} path PNG path @returns {Promise<number>} whitespace share 0 to 1 */
export async function whitespaceShare(path) {
	return whitespaceShareOf(await readRgb(path));
}

const round = (n, digits) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * All pixel measures of one screenshot, decoded once.
 * @param {string} path PNG path
 * @returns {Promise<{ width: number, height: number, colourfulness: number, edgeDensity: number, whitespaceShare: number }>}
 */
export async function analyzePixels(path) {
	const rgb = await readRgb(path);
	return {
		width: rgb.width,
		height: rgb.height,
		colourfulness: round(colourfulnessOf(rgb), 2),
		edgeDensity: round(edgeDensityOf(rgb), 4),
		whitespaceShare: round(whitespaceShareOf(rgb), 4)
	};
}

/**
 * Write a greyscale copy (three equal channels, so every viewer shows it as grey).
 * @param {string} source PNG path
 * @param {string} destination output PNG path
 * @returns {Promise<void>}
 */
export async function writeGreyscale(source, destination) {
	await sharp(source).flatten({ background: '#ffffff' }).greyscale().toColourspace('srgb').png().toFile(destination);
}

/**
 * Write a blurred copy for the squint test.
 * @param {string} source PNG path
 * @param {string} destination output PNG path
 * @param {number} [sigma] Gaussian sigma in px
 * @returns {Promise<void>}
 */
export async function writeBlurred(source, destination, sigma = BLUR_SIGMA) {
	await sharp(source).flatten({ background: '#ffffff' }).blur(sigma).png().toFile(destination);
}

/**
 * Measure one first-viewport screenshot and write its greyscale and blurred copies next to it.
 * @param {string} dir output directory that holds the screenshot
 * @param {string} file screenshot file name inside `dir`, e.g. `desktop-viewport.png`
 * @returns {Promise<{ file: string, greyFile: string, blurFile: string, width: number, height: number, colourfulness: number, edgeDensity: number, whitespaceShare: number }>}
 */
export async function pixelReport(dir, file) {
	const stem = basename(file, '.png');
	const greyFile = `${stem}-grey.png`;
	const blurFile = `${stem}-blur.png`;
	const [measures] = await Promise.all([
		analyzePixels(join(dir, file)),
		writeGreyscale(join(dir, file), join(dir, greyFile)),
		writeBlurred(join(dir, file), join(dir, blurFile))
	]);
	return { file, greyFile, blurFile, ...measures };
}
