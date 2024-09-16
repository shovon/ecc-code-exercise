import { expect, test } from "vitest";
import { bezoutXY, multiplicativeInverse } from "./math";

test("should find the multiplicative inverse", () => {
	expect(bezoutXY(11, 13).x).toBe(6);
	expect(bezoutXY(3, 23).x).toBe(8);
});

test("should find the multiplicative inverse", () => {
	expect(multiplicativeInverse(11n, 13n)).toBe(6n);
	expect(multiplicativeInverse(3n, 23n)).toBe(8n);
});

test("should find the multiplicative inverse", () => {
	expect(multiplicativeInverse(11n, 13n)).toBe(6n);
	expect(multiplicativeInverse(3n, 23n)).toBe(8n);
});
