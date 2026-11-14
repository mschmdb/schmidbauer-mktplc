// Retry helper for flaky browser steps (a full-page capture can fail once and succeed on the next call).

/** Pause before the single retry, in ms (own value; the failing capture needs a moment to recover). */
export const RETRY_DELAY_MS = 500;

/**
 * Run `fn`; when it throws, wait and run it once more. The second error propagates.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, delayMs?: number }} [options]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, { retries = 1, delayMs = RETRY_DELAY_MS } = {}) {
	for (let attempt = 0; ; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (attempt >= retries) throw error;
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
}
