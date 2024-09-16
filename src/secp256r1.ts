/*
 * Implementation of just secp256r1; not generalized to support other curve
 * parameters, nor does it support elliptic curve isogenies.
 */

import { modulo, multiplicativeInverse } from "./math";

export const pointAtInfinity: unique symbol = Symbol("point at infinity");

/**
 * Represents the point at infinity on the secp256r1 curve.
 */
export type PointAtInfinity = typeof pointAtInfinity;

/**
 * Represents some point on the secp256r1 curve.
 */
export type NonPointAtInfinity = Readonly<{
	x: bigint;
	y: bigint;
}>;

/**
 * Represents a point on the curve.
 */
export type Point = Readonly<NonPointAtInfinity | PointAtInfinity>;

/**
 * The constant `a` of the conventially-written Weierstrass polynomail equation.
 */
export const a =
	115792089210356248762697446949407573530086143415290314195533631308867097853948n;

/**
 * The constant `b` of the conventially-written Weierstrass polynomail equation.
 */
export const b =
	41058363725152142129326129780047268409114441015993725554835256314039467401291n;

/**
 * The prime number under which the field is operating under.
 */
export const p =
	115792089210356248762697446949407573530086143415290314195533631308867097853951n;

/**
 * The generator of the elliptic curve of prime field, as defined by p.
 */
export const G: Point = Object.freeze({
	isPointAtInfinity: false,
	x: 48439561293906451759052585252797914202762949526041747995844080717082404635286n,
	y: 36134250956749795798585127919587881956611106672985015071877198253568414405109n,
});

/**
 * The order of the curve.
 */
export const n =
	0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

// Not going to include the cofactor of the curve, since it's just 1.

/**
 * Determines if the given point is on the curve.
 * @param point The point to check
 * @returns True if the point is on the curve; false otherwise
 */
export function isOnCurve(point: Point) {
	if (point === pointAtInfinity) return true;
	const { x, y } = point;
	const lhs = modulo(y ** 2n, p);
	const rhs = modulo(x ** 3n + a * x + b, p);
	return lhs === rhs;
}

/**
 * Determines if the two points are equal.
 * @param p1 The first point to compare
 * @param p2 The second point to compare
 * @returns True if both points are equal; false otherwise
 */
export function areEqual(p1: Point, p2: Point): boolean {
	if (p1 === pointAtInfinity && p1 === pointAtInfinity) return true;
	if (p2 === pointAtInfinity) return false;
	return p1.x === p2.x && p1.y === p2.y;
}

/**
 * A symbol to represent a vertical slope.
 */
const verticalSlope: unique symbol = Symbol("vertical slope");

/**
 * Computes the slope of two points.
 *
 * Will return a constant that represents a symbol of `verticalSlope`.
 * @param p1 The first point
 * @param p2 The second point
 * @returns Either a bigint to represent a "slope" in finite field of prime (p)
 *   order, or `verticalSlope` otherwise.
 */
export function slope(
	p1: NonPointAtInfinity,
	p2: NonPointAtInfinity
): bigint | typeof verticalSlope {
	if (p1.y === modulo(-p2.y, p) && modulo(p1.x, p) === modulo(p2.x, p)) {
		return verticalSlope;
	}
	if (areEqual(p1, p2)) {
		if (p1.y === 0n) return verticalSlope;
		const numerator = 3n * p1.x ** 2n + a;
		const denominator = multiplicativeInverse(modulo(2n * p1.y, p), p);
		const m = modulo(numerator * denominator, p);
		return m;
	}

	const m = modulo(
		(p2.y - p1.y) * multiplicativeInverse(modulo(p2.x - p1.x, p), p),
		p
	);
	return m;
}

/**
 * Adds two points on a curve.
 * @param p1 The first point
 * @param p2 The second point
 * @returns The elliptic curve abelian group addition
 */
export function add(p1: Point, p2: Point): Point {
	if (!isOnCurve(p1)) throw new Error("LHS of add is not on curve!");
	if (!isOnCurve(p2)) throw new Error("RHS of add is not on curve!");

	if (p1 === pointAtInfinity) return p2;
	if (p2 === pointAtInfinity) return p1;

	const m = slope(p1, p2);
	if (m === verticalSlope) return pointAtInfinity;

	// THIS IS WHERE IT IS BROKEN

	const xr = 0n;

	return {
		x: modulo(xr, p),
		y: modulo(m * (p1.x - xr) - p1.y, p),
	};
}

function secureRandomBigInt(bitLength: number) {
	const byteLength = Math.ceil(bitLength / 8);

	const randomBytes = new Uint8Array(byteLength);

	crypto.getRandomValues(randomBytes);

	const hexString = Array.from(randomBytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return BigInt("0x" + hexString) & ((1n << BigInt(bitLength)) - 1n);
}

export function negate(point: Point): Point {
	if (point === pointAtInfinity) return point;
	return {
		x: point.x,
		y: modulo(-point.y, p),
	};
}

/**
 * Computes the scalar multiplication of the point on the curve
 * @param n The factor to scalar multiply the point by
 * @param point The point to scalar multiply
 * @returns A new point on the curve
 */
export function scalarMultiply(n: bigint, point: Point): Point {
	if (n < 0n) return scalarMultiply(-n, negate(point));
	let result: Point = pointAtInfinity;
	let temp: Point = point;
	for (const c of n.toString(2).split("").reverse()) {
		console.assert(
			c === "1" || c === "0",
			`Expected the character to either be '1' or '0', but got ${c}`
		);
		if (c === "1") {
			result = add(result, temp);
		}
		temp = add(temp, temp);
	}
	return result;
}

/**
 * Generates a value that is going to be a safe scalar value that will never
 * return neither the generator nor the point at infinity.
 * @returns a bigint that will be a safe scalar value that won't be neither one
 *   nor a factor of the order of the curve
 */
export function generateSafeScalar(): bigint {
	let scalar = -1n;
	while (scalar < 1 || scalar >= n) {
		scalar = secureRandomBigInt(256);
	}
	return scalar;
}
