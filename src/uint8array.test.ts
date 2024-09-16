import { test, expect } from "vitest";
import { concatenateUint8Arrays } from "./uint8array";

test("concatenate should be successful", () => {
	const first = new Uint8Array(1);
	const second = new Uint8Array(1);
	first[0] = 10;
	second[0] = 24;
	const concatenated = concatenateUint8Arrays(first, second);
	expect(concatenated[0]).toBe(10);
	expect(concatenated[1]).toBe(24);
});
