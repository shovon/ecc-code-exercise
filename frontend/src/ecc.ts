import { bigIntToByteArray, uint8ArrayToBigInt } from "./bigint";
import { modulo, multiplicativeInverse } from "./math";
import {
	add,
	G,
	generateSafeScalar,
	isOnCurve,
	n,
	NonPointAtInfinity,
	Point,
	pointAtInfinity,
	scalarMultiply,
} from "./secp256r1";
import { concatenateUint8Arrays } from "./uint8array";

function leftPadUint8Array(arr: Uint8Array, targetLength: number): Uint8Array {
	// If no padding is needed, return the original array
	if (arr.length >= targetLength) {
		return arr;
	}

	// Create a new Uint8Array of the desired length, filled with zeroes
	const paddedArray = new Uint8Array(targetLength);

	// Copy the original array into the end of the new array (right-aligned)
	paddedArray.set(arr, targetLength - arr.length);

	return paddedArray;
}

/**
 * Converts the point into an uncompressed format.
 * @param point The point to convert to the uncompressed key format (the one
 *   that is prefixed with x)
 * @returns The point as a uint8array
 */
export function uncompressedKeyFormat(point: NonPointAtInfinity): Uint8Array {
	const unpadded = bigIntToByteArray(point.x);
	const padded = leftPadUint8Array(bigIntToByteArray(point.x), 32);
	console.log(unpadded, padded);
	console.log(bigIntToByteArray(point.y).length);
	return concatenateUint8Arrays(
		bigIntToByteArray(0x04n),
		leftPadUint8Array(bigIntToByteArray(point.x), 32),
		leftPadUint8Array(bigIntToByteArray(point.y), 32)
	);
}

/**
 * Parses the uncompressed string
 * @param str Uncompressed buffer
 */
export function parseUncompressed(arr: Uint8Array): Point {
	if (arr.length !== 65) throw new Error("Invalid key");
	if (arr[0] !== 0x04) throw new Error("Invalid key");
	const x = arr.slice(1, 33);
	const y = arr.slice(33, 65);
	return { x: uint8ArrayToBigInt(x), y: uint8ArrayToBigInt(y) };
}

/**
 * Converts the r and s parameters of a signature into a concatenated format.
 * @param param0 The r and s parameters
 * @returns A cocnatenation of the r and s parameters
 */
export function formatSignature({
	r,
	s,
}: {
	r: bigint;
	s: bigint;
}): Uint8Array {
	return concatenateUint8Arrays(
		leftPadUint8Array(bigIntToByteArray(r), 32),
		leftPadUint8Array(bigIntToByteArray(s), 32)
	);
}

/**
 * Signs the given hash, and retrieves the r and s coordinates.
 * @param d The private key used to sign the message
 * @param hash The hash to sign
 * @returns Coordinates r and s that represents the signature
 */
export function ecdsaSign(
	d: bigint,
	hash: Uint8Array
): { r: bigint; s: bigint } {
	const z = uint8ArrayToBigInt(
		hash.slice(0, Math.ceil(n.toString(16).length / 2))
	);
	let k = generateSafeScalar();
	let kG = scalarMultiply(k, G);
	while (kG === pointAtInfinity) {
		k = generateSafeScalar();
		kG = scalarMultiply(k, G);
	}
	const r = modulo(kG.x, n);
	const s = modulo(multiplicativeInverse(k, n) * (z + r * d), n);
	return { r, s };
}

/**
 * Verifies the signature.
 * @param dG The public key
 * @param hash The hash to verify
 * @param signature The signature
 * @returns True if verification is successful; false otherwise
 */
export function ecdsaVerify(
	dG: Point,
	hash: Uint8Array,
	{ r, s }: { r: bigint; s: bigint }
): boolean {
	if (dG === pointAtInfinity) return false;
	if (!isOnCurve(dG)) return false;
	if (scalarMultiply(n, dG) !== pointAtInfinity) return false;

	if (r < 1 || r >= n) return false;
	if (s < 1 || s >= n) return false;

	// const z = uint8ArrayToBigInt(
	// 	hash.slice(0, Math.ceil(n.toString(16).length / 2))
	// );
	const z = uint8ArrayToBigInt(hash);

	const s1 = multiplicativeInverse(s, n);
	const u1 = modulo(z * s1, n);
	const u2 = modulo(r * s1, n);

	const newPoint = add(scalarMultiply(u1, G), scalarMultiply(u2, dG));

	if (newPoint === pointAtInfinity) return false;

	// console.log(modulo(newPoint.x, n), modulo(r, n));
	return modulo(newPoint.x, n) === modulo(r, n);
}

/**
 * Derives an AES-256-GCM encryption key.
 * @param sharedSecret Point on the ellyptic curve
 * @param salt The salt
 * @returns A promise containing the crypto key
 */
export async function deriveKeys(sharedSecret: bigint, salt: Uint8Array) {
	const hkdfKey = await crypto.subtle.importKey(
		"raw",
		bigIntToByteArray(sharedSecret),
		{ name: "HKDF" },
		false,
		["deriveKey", "deriveBits"]
	);

	const encryptionKey = await crypto.subtle.deriveKey(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: salt,
			info: new Uint8Array([0x01]),
		},
		hkdfKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"]
	);

	return encryptionKey;
}
