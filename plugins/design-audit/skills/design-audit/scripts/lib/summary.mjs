// The short summary audit.mjs prints. The full result stays in audit.json.
import { join } from 'node:path';

/**
 * @param {Record<string, any>} result the object written to audit.json
 * @param {string} outDir output directory
 * @returns {{ url: string, outDir: string, auditJson: string, incomplete: boolean, notes: string[], viewports: Record<string, { status: number | null, measured: boolean, missing: string[] } | null> }}
 */
export function summarise(result, outDir) {
	const viewport = (v) => (v ? { status: v.status, measured: !!v.measure, missing: v.missing } : null);
	return {
		url: result.url,
		outDir,
		auditJson: join(outDir, 'audit.json'),
		incomplete: result.incomplete,
		notes: result.notes,
		viewports: { desktop: viewport(result.desktop), mobile: viewport(result.mobile) }
	};
}
