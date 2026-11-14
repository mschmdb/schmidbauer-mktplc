// Loads the injectable design scripts and merges what they return.
// Shared by audit.mjs and the browser tests; it does not start a browser itself.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAtViewport } from './lib/viewport.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** Injectable scripts in run order. Each returns one JSON object; the objects are merged by key. */
export const DESIGN_SCRIPT_FILES = ['measure-design.js', 'measure-design-gestalt.js', 'measure-design-view.js'];

/**
 * Source text of every design script that exists.
 * @returns {{ file: string, source: string }[]}
 */
export function designScriptSources() {
	return DESIGN_SCRIPT_FILES.filter((file) => existsSync(join(here, file))).map((file) => ({
		file,
		source: readFileSync(join(here, file), 'utf8')
	}));
}

/**
 * Run all design scripts in a page and merge their results.
 * `limits` from each script is kept under `limits[<file>]`.
 * @param {import('playwright').Page} page
 * @returns {Promise<Record<string, any>>}
 */
export async function runDesignScripts(page) {
	const parts = [];
	for (const { file, source } of designScriptSources()) parts.push([file, await evaluateAtViewport(page, source)]);
	return mergeDesignParts(parts);
}

/**
 * @param {[string, Record<string, any>][]} parts file name and result object per script
 * @returns {Record<string, any>}
 */
export function mergeDesignParts(parts) {
	const merged = { limits: {} };
	for (const [file, part] of parts) {
		const { limits, ...rest } = part;
		merged.limits[file] = limits;
		Object.assign(merged, rest);
	}
	return merged;
}
