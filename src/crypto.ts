/**
 * Computes the SHA-256 of a Uint8Array.
 * @param arr The array to compute the SHA-256 hash on.
 * @returns An ArrayBuffer wrapped in a promise.
 */
export const sha256 = async (arr: Uint8Array): Promise<ArrayBuffer> =>
	await crypto.subtle.digest("SHA-256", arr);
