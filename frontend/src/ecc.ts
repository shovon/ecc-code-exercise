import { bigIntToByteArray, uint8ArrayToBigInt } from "./bigint";
import { sha256 } from "./crypto";
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
import { concatenateUint8Arrays, fromBase64, toBase64 } from "./uint8array";

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
export function parseUncompressed(arr: Uint8Array): NonPointAtInfinity {
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

export function unformatSignature(signature: Uint8Array): {
	r: bigint;
	s: bigint;
} {
	if (signature.length !== 64) {
		throw new Error("Invalid signature format");
	}

	const r = uint8ArrayToBigInt(signature.slice(0, 32));
	const s = uint8ArrayToBigInt(signature.slice(32, 64));
	return { r, s };
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

type ECIESEncryptedMaterial = {
	ephemeralKey: NonPointAtInfinity;
	salt: Uint8Array;
	ciphertext: Uint8Array;
	iv: Uint8Array;
};

export function encodeECIESMaterial({
	ephemeralKey,
	salt,
	ciphertext,
	iv,
}: ECIESEncryptedMaterial): string {
	const keyPart = toBase64(uncompressedKeyFormat(ephemeralKey));
	const saltPart = toBase64(salt);
	const ciphertextPart = toBase64(ciphertext);
	const ivPart = toBase64(iv);
	return [keyPart, saltPart, ciphertextPart, ivPart].join(".");
}

export async function decodeECIESMaterial(
	material: string
): Promise<ECIESEncryptedMaterial> {
	const parts = material.split(".");
	if (parts.length !== 4) {
		throw new Error("Malformed material");
	}
	const [keyPart, saltPart, ciphertextPart, ivPart] = parts;
	const ephemeralKey = parseUncompressed(await fromBase64(keyPart));
	const salt = await fromBase64(saltPart);
	const ciphertext = await fromBase64(ciphertextPart);
	const iv = await fromBase64(ivPart);
	return {
		ephemeralKey,
		salt,
		ciphertext,
		iv,
	};
}

/**
 * Encrypts a message using the ECIES encryption scheme.
 * @param publicKey The other party's public key
 * @param message The message to encrypt
 * @returns Encryption material
 */
export async function eciesEncrypt(
	publicKey: NonPointAtInfinity,
	message: Uint8Array
): Promise<ECIESEncryptedMaterial> {
	// Ephemeral private key
	const r = generateSafeScalar();

	// Ephemeral public key
	const R = scalarMultiply(r, G);
	if (R === pointAtInfinity) {
		throw new Error(
			"Generated scalar ended up being a multiple of the generator order!"
		);
	}

	// Shared secret
	const P = scalarMultiply(r, publicKey);
	if (P === pointAtInfinity) {
		throw new Error(
			"Generated scalar ended up being a multiple of the generator order!"
		);
	}

	const salt = new Uint8Array(32);
	crypto.getRandomValues(salt);

	const encryptionKey = await deriveKeys(P.x, salt);

	// Generate a random Initialization Vector (IV), typically 12 bytes for AES-GCM
	const iv = crypto.getRandomValues(new Uint8Array(12));

	// Encrypt the data using AES-GCM with the derived key and IV
	const encryptedData = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: iv, // Initialization Vector
			tagLength: 128, // Tag length (default for AES-GCM)
		},
		encryptionKey, // The derived key
		message // The plaintext data as an ArrayBuffer
	);

	return {
		ephemeralKey: R,
		salt,
		ciphertext: new Uint8Array(encryptedData),
		iv,
	};
}

export async function eciesDecrypt(
	privateKey: bigint,
	{ ephemeralKey, salt, ciphertext, iv }: ECIESEncryptedMaterial
): Promise<Uint8Array | null> {
	const P = scalarMultiply(privateKey, ephemeralKey);
	if (P === pointAtInfinity) {
		return null;
	}

	const decryptionKey = await deriveKeys(P.x, salt);

	return new Uint8Array(
		await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv,
				tagLength: 128,
			},
			decryptionKey,
			ciphertext
		)
	);
}

export async function schemeEncrypt(
	senderPrivateKey: bigint,
	recipientPublicKey: NonPointAtInfinity,
	message: Uint8Array
) {
	const material = encodeECIESMaterial(
		await eciesEncrypt(recipientPublicKey, message)
	);
	const signature = ecdsaSign(
		senderPrivateKey,
		new Uint8Array(await sha256(new TextEncoder().encode(material)))
	);

	return [btoa(material), toBase64(formatSignature(signature))].join(".");
}

export async function schemeVerifyAndDecrypt(
	senderPublicKey: NonPointAtInfinity,
	recipientPrivateKey: bigint,
	payloadAndSignature: string
): Promise<
	| { message: Uint8Array | null; valid: false }
	| { message: Uint8Array; valid: true }
> {
	try {
		const parts = payloadAndSignature.split(".");
		if (parts.length !== 2) {
			return { message: null, valid: false };
		}
		const [materialPart, signaturePart] = parts;
		const material = atob(materialPart);
		const signature = unformatSignature(await fromBase64(signaturePart));

		const verified = ecdsaVerify(
			senderPublicKey,
			new Uint8Array(await sha256(new TextEncoder().encode(material))),
			signature
		);

		const eciesMaterial = await decodeECIESMaterial(material);

		const message = await eciesDecrypt(recipientPrivateKey, eciesMaterial);
		if (verified && message) {
			return { message, valid: true };
		}
		return { message, valid: false };
	} catch (e) {
		console.error(e);
		return { message: null, valid: false };
	}
}

export async function isValidPublicKey(base64String: string): Promise<boolean> {
	const publicKey = await fromBase64(base64String);
	if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
		return false;
	}
	const point = parseUncompressed(publicKey);
	return isOnCurve(point);
}
