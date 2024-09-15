import { expect, test } from "vitest";
import {
	G,
	scalarMultiply,
	add,
	Point,
	pointAtInfinity,
	p,
	negate,
	isOnCurve,
} from "./secp256r1";
import { modulo } from "./math";

test("G is on curve", () => {
	expect(isOnCurve(G)).toBe(true);
});

test("add G to itself", () => {
	const expected = {
		x: 56515219790691171413109057904011688695424810155802929973526481321309856242040n,
		y: 3377031843712258259223711451491452598088675519751548567112458094635497583569n,
	};

	const result = add(G, G);
	if (result === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}
	expect(result.x).toBe(expected.x);
	expect(result.y).toBe(expected.y);
	expect(isOnCurve(result)).toBe(true);
});

test("double G", () => {
	const expected = {
		x: 56515219790691171413109057904011688695424810155802929973526481321309856242040n,
		y: 3377031843712258259223711451491452598088675519751548567112458094635497583569n,
	};

	const result = scalarMultiply(2n, G);
	if (result === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}
	expect(result.x).toBe(expected.x);
	expect(result.y).toBe(expected.y);
	expect(isOnCurve(result)).toBe(true);
});

test("add G to something", () => {
	const expected = {
		x: 42877656971275811310262564894490210024759287182177196162425349131675946712428n,
		y: 61154801112014214504178281461992570017247172004704277041681093927569603776562n,
	};

	const a: Point = Object.freeze({
		x: 56515219790691171413109057904011688695424810155802929973526481321309856242040n,
		y: 3377031843712258259223711451491452598088675519751548567112458094635497583569n,
	});

	const b = G;

	const result = add(a, b);
	if (result === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}
	expect(result.x).toBe(expected.x);
	expect(result.y).toBe(expected.y);
	expect(isOnCurve(result)).toBe(true);
});

test("3G", () => {
	const expected = {
		x: 42877656971275811310262564894490210024759287182177196162425349131675946712428n,
		y: 61154801112014214504178281461992570017247172004704277041681093927569603776562n,
	};
	const result = scalarMultiply(3n, G);
	if (result === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}
	expect(result.x).toBe(expected.x);
	expect(result.y).toBe(expected.y);
	expect(isOnCurve(result)).toBe(true);
});

test("compute a scalar multiplication", () => {
	const coefficient =
		115791935673459975510133249833303905953524705357070648582135449074950671051339n;
	const expected = {
		x: 31545434377700106492689252174553101734201525521676808490353875129420856220453n,
		y: 101807916848561521372823002724006651351129844726995419635105934569246111734754n,
	};

	const dG = scalarMultiply(coefficient, G);
	if (dG === pointAtInfinity) {
		throw new Error("Should not be point at inifnity");
	}
	expect(dG.x).toBe(expected.x);
	expect(dG.y).toBe(expected.y);
	expect(isOnCurve(dG)).toBe(true);
});

test("negate", async () => {
	if (G === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}
	const expected = {
		x: G.x,
		y: modulo(-G.y, p),
	};

	const dG = negate(G);
	if (dG === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}
	expect(dG.x).toBe(expected.x);
	expect(dG.y).toBe(expected.y);
	expect(isOnCurve(dG)).toBe(true);
});

test("negate using scalar multiplication", async () => {
	const coefficient = -1n;
	if (G === pointAtInfinity) {
		throw new Error("G should not be point at infinity");
	}
	const expected = {
		x: G.x,
		y: modulo(-G.y, p),
	};

	const dG = scalarMultiply(coefficient, G);
	if (dG === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}

	expect(dG.x).toBe(expected.x);
	expect(dG.y).toBe(expected.y);
	expect(isOnCurve(dG)).toBe(true);
});

test("scalar multiplication using negative scalar", async () => {
	const coefficient = -256n;
	if (G === pointAtInfinity) {
		throw new Error("G should not be point at infinity");
	}
	const expected = negate(scalarMultiply(-coefficient, G));

	if (expected === pointAtInfinity) {
		throw new Error("expected should not be point at infinity");
	}

	const dG = scalarMultiply(coefficient, G);
	if (dG === pointAtInfinity) {
		throw new Error("Should not be point at infinity");
	}

	expect(dG.x).toBe(expected.x);
	expect(dG.y).toBe(expected.y);
	expect(isOnCurve(dG)).toBe(true);
});
