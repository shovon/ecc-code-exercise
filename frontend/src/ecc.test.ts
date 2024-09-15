import { expect, test } from "vitest";
import { areEqual, G, isOnCurve, scalarMultiply } from "./secp256r1";
import {
	ecdsaSign,
	ecdsaVerify,
	parseUncompressed,
	uncompressedKeyFormat,
} from "./ecc";
import { fromBase64 } from "./uint8array";

test("ecdsa verify", async () => {
	const message = new TextEncoder().encode("Hello, World!");
	const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", message));

	const publicKey = {
		x: 1227531136851072306399616257763385555463707176189921119260468650815840078905n,
		y: 72400973557907635383026146117340945016993908415396308190137405300086690394003n,
	};
	const signature = {
		r: 79573662234861430083338255317026625948223905763383166474235196771266123739061n,
		s: 73798227634178774684713628831372311512235763921764016637006824566767600908193n,
	};

	expect(ecdsaVerify(publicKey, hash, signature)).toBe(true);
});

test("ecdsa sign and verify", async () => {
	const privateKey =
		56858716478340211729183373571749239357779866779376650919920631838952266887861n;
	const publicKey = scalarMultiply(privateKey, G);
	const message = new TextEncoder().encode("Hello, World!");
	const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", message));

	const signature = ecdsaSign(privateKey, hash);

	expect(ecdsaVerify(publicKey, hash, signature)).toBe(true);
});

test("parse BIggmIpM8FE/khj8PzhL0fihwFJxucVbSOX/RPV7jFi1AH0uIr1gQWf21ybWvQ9F30dv510F/ym4uV+85nn1XdI=", async () => {
	const point = parseUncompressed(
		await fromBase64(
			"BIggmIpM8FE/khj8PzhL0fihwFJxucVbSOX/RPV7jFi1AH0uIr1gQWf21ybWvQ9F30dv510F/ym4uV+85nn1XdI="
		)
	);
	expect(isOnCurve(point)).toBe(false);
});

test("parse BK0BoBphDGOeiuNqHzQabXhSAB+vTU85xDIFgibnImE40TAuxEuv3N+ar7HqDXfJVa2Zd1Sn7kZe+i2PkXyLDt4=", async () => {
	const privateKey =
		61361177301120546798353184446776238059365544349563880419457840251303464899864n;

	const point = parseUncompressed(
		await fromBase64(
			"BK0BoBphDGOeiuNqHzQabXhSAB+vTU85xDIFgibnImE40TAuxEuv3N+ar7HqDXfJVa2Zd1Sn7kZe+i2PkXyLDt4="
		)
	);

	expect(isOnCurve(point)).toBe(true);
	expect(areEqual(scalarMultiply(privateKey, G), point)).toBe(true);
});

test("parse BMoyo0heUlP47wQ6cLI/w0+H6QKrpajIulcsy8zYoTS5AL6eNlZ3T/lBPEB+sxVrg8eTgzRCPQB5U/XPPhZjnEw=", async () => {
	const privateKey =
		59721796779980987953782743946439591747350922515745152347278897169352940936445n;
	const point = parseUncompressed(
		await fromBase64(
			"BMoyo0heUlP47wQ6cLI/w0+H6QKrpajIulcsy8zYoTS5AL6eNlZ3T/lBPEB+sxVrg8eTgzRCPQB5U/XPPhZjnEw="
		)
	);

	expect(isOnCurve(point)).toBe(false);
	expect(areEqual(scalarMultiply(privateKey, G), point)).toBe(false);
});

test("parse BABJKIV4T7rydEPhSGMEbdAlDru03AlGhl09gicUMhfou+RMIpQ6Ey4D8BFwRKZHAFovQ1eHxhiOECxr+079vf0=", async () => {
	const privateKey =
		91911031212055937943075599530209940377312524244214428406112119031385011201007n;
	const expectedPoint = {
		x: 2068152062813992596252679913034127308650187859897158051694209218341442256524n,
		y: 84985869280810938822619903456973871732398535116278624509039233274490587561469n,
	};
	const parsedPoint = parseUncompressed(
		await fromBase64(
			"BABJKIV4T7rydEPhSGMEbdAlDru03AlGhl09gicUMhfou+RMIpQ6Ey4D8BFwRKZHAFovQ1eHxhiOECxr+079vf0="
		)
	);
	expect(areEqual(scalarMultiply(privateKey, G), expectedPoint)).toBe(true);
	expect(areEqual(expectedPoint, parsedPoint)).toBe(false);
});

test("encoded 2068152062813992596252679913034127308650187859897158051694209218341442256524 84985869280810938822619903456973871732398535116278624509039233274490587561469", async () => {
	// const privateKey =
	// 	91911031212055937943075599530209940377312524244214428406112119031385011201007n;
	const expectedPoint = {
		x: 2068152062813992596252679913034127308650187859897158051694209218341442256524n,
		y: 84985869280810938822619903456973871732398535116278624509039233274490587561469n,
	};
	const encoded = uncompressedKeyFormat(expectedPoint);
	const parsed = parseUncompressed(encoded);
	expect(areEqual(expectedPoint, parsed)).toBe(true);
});
