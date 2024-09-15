import * as crypto from "crypto";

/**
 * Given a base64-encoded string, decode it, determine if the buffer contains
 * the 0x04 header.
 */
export function publicKeyFromUncompressed(uncompressed: string) {
	console.log(Buffer.from(uncompressed, "base64").length);
	const pemKey = Buffer.concat([
		Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex"),
		Buffer.from(uncompressed, "base64"),
	]);

	// Convert to a crypto.KeyObject
	return crypto.createPublicKey({
		key: pemKey,
		format: "der",
		type: "spki",
	});
}

function convertP1363ToDER(p1363Signature: Buffer) {
	const r = p1363Signature.subarray(0, 32);
	const s = p1363Signature.subarray(32);

	const rLength = r[0] === 0 ? 31 : 32;
	const sLength = s[0] === 0 ? 31 : 32;

	const derSignature = Buffer.alloc(6 + rLength + sLength);

	derSignature[0] = 0x30; // Sequence tag
	derSignature[1] = 4 + rLength + sLength; // Total length
	derSignature[2] = 0x02; // Integer tag for r
	derSignature[3] = rLength; // r length
	r.copy(derSignature, 4, r[0] === 0 ? 1 : 0); // r value
	derSignature[4 + rLength] = 0x02; // Integer tag for s
	derSignature[5 + rLength] = sLength; // s length
	s.copy(derSignature, 6 + rLength, s[0] === 0 ? 1 : 0); // s value

	return derSignature;
}

/**
 *
 * @param key
 * @param message
 * @param signature
 */
export function verify(
	key: crypto.KeyObject,
	message: Buffer,
	signature: Buffer
): boolean {
	const verify = crypto.createVerify("sha256");
	verify.update(message);
	return verify.verify(key, convertP1363ToDER(signature));
}
