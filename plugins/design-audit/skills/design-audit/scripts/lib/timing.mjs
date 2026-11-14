// Notes about load timing: frames that came late and what kept an unsettled page busy. Pure logic, no DOM.

/** A frame captured later than this after its target time gets a note (own value). */
export const LATE_FRAME_TOLERANCE_MS = 200;

/**
 * @param {string} name viewport name
 * @param {{ targetMs: number, atMs: number }[]} frames captured frames
 * @param {number} [toleranceMs]
 * @returns {string[]} one note per late frame, e.g. "desktop: t300 captured at 940 ms, 640 ms after its target"
 */
export function lateFrameNotes(name, frames, toleranceMs = LATE_FRAME_TOLERANCE_MS) {
	return frames
		.filter((f) => f.atMs - f.targetMs > toleranceMs)
		.map((f) => `${name}: t${f.targetMs} captured at ${f.atMs} ms, ${f.atMs - f.targetMs} ms after its target; the frame shows a later state.`);
}

/**
 * What kept the page busy when it did not settle. Only facts that were measured.
 * @param {{ pendingRequests: number, runningAnimations: number, infiniteAnimations: number, lastMutation: string | null, fontsReady: boolean, quiet: boolean }} state
 * @returns {string}
 */
export function describeBusy({ pendingRequests, runningAnimations, infiniteAnimations, lastMutation, fontsReady, quiet }) {
	const parts = [];
	if (!fontsReady) parts.push('web fonts not ready');
	if (!quiet && lastMutation) parts.push(`last DOM change in ${lastMutation}`);
	parts.push(`${pendingRequests} pending ${pendingRequests === 1 ? 'request' : 'requests'}`);
	parts.push(`${runningAnimations} running ${runningAnimations === 1 ? 'animation' : 'animations'} (${infiniteAnimations} endless)`);
	return parts.join(', ');
}
