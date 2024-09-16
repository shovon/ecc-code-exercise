export function concatenateUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
	const length = arrays.map((a) => a.length).reduce((a, b) => a + b);
	const concatenated = new Uint8Array(length);
	let count = 0;
	for (const arr of arrays) {
		concatenated.set(arr, count);
		count += arr.length;
	}
	return concatenated;
}

export function toBase64(buffer: Uint8Array) {
	const binary = String.fromCharCode.apply(null, [...buffer]);
	return btoa(binary);
}

export async function fromBase64(base64: string): Promise<Uint8Array> {
	const response = await fetch(
		`data:application/octet-stream;base64,${base64}`
	);
	const blob = await response.blob();
	const arrayBuffer = await blob.arrayBuffer();
	return new Uint8Array(arrayBuffer);
}
