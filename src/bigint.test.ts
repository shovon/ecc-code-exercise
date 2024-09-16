import { test, expect } from "vitest";
import { bigIntToByteArray, uint8ArrayToBigInt } from "./bigint";

test("zero padded", () => {
	expect(uint8ArrayToBigInt(new Uint8Array([0, 8]))).toBe(8n);
});
test("non-zero-padded 0x0810", () => {
	expect(uint8ArrayToBigInt(new Uint8Array([8, 16]))).toBe(0x0810n);
});
test("zero padded 0x0810", () => {
	expect(uint8ArrayToBigInt(new Uint8Array([0, 8, 16]))).toBe(0x0810n);
});

test("2068152062813992596252679913034127308650187859897158051694209218341442256524 unpadded", () => {
	const value =
		2068152062813992596252679913034127308650187859897158051694209218341442256524n;
	expect(uint8ArrayToBigInt(bigIntToByteArray(value))).toBe(value);
});

test("big int to array should match", () => {
	const bignum =
		56515219790691171413109057904011688695424810155802929973526481321309856242040n;
	const str =
		"7cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc47669978";

	const bArr = bigIntToByteArray(bignum);
	expect(bArr.length).toBe(str.length / 2);
});
