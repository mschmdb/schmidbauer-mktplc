// Turns the merged raw object of the measure-design*.js scripts into `<viewport>.design`.
// The `tells` part is returned separately: audit.mjs merges it into `measure.tells`.
import { deriveColour } from './colour.mjs';
import { deriveFirstViewport, deriveHierarchy } from './hierarchy.mjs';
import { rankProminence } from './prominence.mjs';
import { deriveProximity } from './proximity.mjs';
import { deriveRegion, deriveSimilarity } from './similarity.mjs';
import { deriveAlignment, deriveSpacing } from './spacing.mjs';
import { deriveTells } from './tells.mjs';
import { deriveTypography } from './typography.mjs';

/**
 * @param {Record<string, any>} raw merged result of the design scripts (see design-scripts.mjs)
 * @returns {{ design: Record<string, any>, tells: Record<string, any> }} derived design tree and the tells to merge into `measure.tells`
 */
export function finishDesign(raw) {
	const typography = deriveTypography(raw.typography);
	const similarity = deriveSimilarity(raw.similarity);
	const firstViewport = deriveFirstViewport(raw.firstViewport);
	return {
		design: {
			limits: raw.limits,
			typography,
			spacing: deriveSpacing(raw.spacing),
			alignment: deriveAlignment(raw.alignment),
			proximity: deriveProximity(raw.proximity),
			similarity,
			region: deriveRegion(raw.region),
			colour: deriveColour(raw.colour),
			hierarchy: deriveHierarchy(raw.hierarchy),
			firstViewport,
			prominence: rankProminence(raw.prominence.candidates, { width: firstViewport.width, height: firstViewport.height })
		},
		tells: deriveTells(raw.tells, { typography, similarity })
	};
}
