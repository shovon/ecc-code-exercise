/**
 * Retrieves the remainder of the euclidean division
 * @param a The dividend
 * @param m The divisor
 * @returns The "remainder" of the euclidean division
 */
export function modulo(a: bigint, m: bigint) {
	return ((a % m) + m) % m;
}

/**
 * Given the factors a and b of the linear combination to satisfy the Bézout's
 * identity ax + by = gcd(a, b), returns the x and y factors.
 * @param a First integer
 * @param b Second integer
 * @returns An object containing the x and y factors of the linear combination
 */
export function bezoutXYBigint(a: bigint, b: bigint): { x: bigint; y: bigint } {
	if (b === 0n) return { x: 1n, y: 0n };
	const result = bezoutXYBigint(b, modulo(a, b));
	return { x: result.y, y: result.x - (a / b) * result.y };
}

export function moduloNumber(a: number, m: number) {
	return ((a % m) + m) % m;
}

/**
 * Given the factors a and b of the linear combination to satisfy the Bézout's
 * identity ax + by = gcd(a, b), returns the x and y factors.
 * @param a First integer
 * @param b Second integer
 * @returns An object containing the x and y factors of the linear combination
 */
export function bezoutXY(a: number, b: number): { x: number; y: number } {
	if (b === 0) return { x: 1, y: 0 };
	const result = bezoutXY(b, moduloNumber(a, b));
	return { x: result.y, y: result.x - Math.floor(a / b) * result.y };
}

export function extendedGcd(
	a: bigint,
	b: bigint
): { result: bigint; x: bigint; y: bigint } {
	if (a === 0n) {
		return { result: b, x: 0n, y: 1n };
	}

	const { result, x: x1, y: y1 } = extendedGcd(b % a, a);

	return { result, x: y1 - (b / a) * x1, y: x1 };
}

/**
 * Computes the multiplicative inverse of the given value, finite field of the
 * prime `p`.
 * @param value The value to find the multiplicative inverse
 * @returns The multiplicative inverse of value, only if the inverse exists
 */
export function multiplicativeInverse(value: bigint, divisor: bigint): bigint {
	const { result: g, x } = extendedGcd(value, divisor);
	if (g != 1n) {
		throw new Error("Inverse does not exist!");
	}

	return modulo(x, divisor);
}
