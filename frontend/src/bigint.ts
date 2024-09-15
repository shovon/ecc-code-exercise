export function bigIntToByteArray(bigInt: bigint) {
	let hex = bigInt.toString(16);
	hex = hex.padStart(Math.ceil(hex.length / 2) * 2, "0");
	const byteArray = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		byteArray[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return byteArray;
}

export function uint8ArrayToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) + BigInt(byte);
	}
	return result;
}
