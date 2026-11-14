#!/usr/bin/env node
// Audit one URL: axe-core (desktop), page measurements, AI-look signals, text repetition,
// design measurements and pixel measures of the first viewport, screenshots, a scroll series and
// load-animation frames, each for desktop and mobile.
// Usage: node audit.mjs <url> <output-dir>
// Output: <output-dir>/audit.json { url, notes, desktop, mobile } plus the PNG files it names.
import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditViewport, MOBILE_DEVICE } from './audit-viewport.mjs';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
	console.error('Usage: node audit.mjs <url> <output-dir>');
	process.exit(2);
}
mkdirSync(out, { recursive: true });

const notes = [];
const result = { url, incomplete: false, notes, desktop: null, mobile: null };
// SwiftShader so WebGL animation renders headless.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
	const mobileDevice = devices[MOBILE_DEVICE];
	if (!mobileDevice) throw new Error(`Playwright has no device descriptor "${MOBILE_DEVICE}".`);
	const { defaultBrowserType: _ignored, ...mobileOptions } = mobileDevice;
	result.desktop = await auditViewport(browser, 'desktop', { viewport: { width: 1440, height: 900 } }, notes, { url, out });
	result.mobile = await auditViewport(browser, 'mobile', mobileOptions, notes, { url, out });
} finally {
	await browser.close();
	// A viewport that never started, or lacks any capture or measurement, makes the run incomplete.
	result.incomplete = !result.desktop || !result.mobile || result.desktop.missing.length > 0 || result.mobile.missing.length > 0;
	writeFileSync(join(out, 'audit.json'), JSON.stringify(result, null, 1));
}

console.log(JSON.stringify(result, null, 1));
for (const name of ['desktop', 'mobile']) {
	if (!result[name]?.measure) {
		console.error(`${name} audit did not complete. See "notes" in audit.json.`);
		process.exitCode = 1;
	}
}
