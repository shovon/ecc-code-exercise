import * as nodeCrypto from "crypto";

/**
 * Given a base64-encoded string, decode it, determine if the buffer contains
 * the 0x04 header.
 */
export function publicKeyFromUncompressed(uncompressed: string) {
	const pemKey = Buffer.concat([
		Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex"),
		Buffer.from(uncompressed, "base64"),
	]);

	// Convert to a crypto.KeyObject
	return nodeCrypto.createPublicKey({
		key: pemKey,
		format: "der",
		type: "spki",
	});
}

/**
 *
 * @param key
 * @param message
 * @param signature
 */
export async function verify(
	key: Buffer,
	message: Buffer,
	signature: Buffer
): Promise<boolean> {
	const publicKey = await crypto.subtle.importKey(
		"raw",
		new Uint8Array(key),
		{
			name: "ECDSA",
			namedCurve: "P-256",
		},
		true,
		["verify"]
	);
	return await crypto.subtle.verify(
		{
			name: "ECDSA",
			hash: { name: "SHA-256" },
		},
		publicKey,
		signature,
		message
	);
	// return false;
}
