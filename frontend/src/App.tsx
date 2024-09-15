import { useEffect } from "react";

import "./App.css";
import {
	G,
	generateSafeScalar,
	pointAtInfinity,
	scalarMultiply,
} from "./secp256r1";
import { sha256 } from "./crypto";
import { toBase64 } from "./uint8array";
import {
	ecdsaSign,
	ecdsaVerify,
	formatSignature,
	uncompressedKeyFormat,
} from "./ecc";

class Connection {
	private privateKey = generateSafeScalar();
	private ws: WebSocket | null = null;
	constructor() {
		fetch("http://localhost:3030/connection-token", {
			method: "POST",
			credentials: "include",
		}).then(async (response) => {
			const result = (await response.json()) as
				| { token?: unknown }
				| null
				| undefined;
			if (!result) {
				throw new Error("No result set");
			}
			if (typeof result.token !== "string") {
				throw new Error("Token not set");
			}

			const signature = ecdsaSign(
				this.privateKey,
				new Uint8Array(await sha256(new TextEncoder().encode(result.token)))
			);
			const tokenToSend = `${btoa(result.token)}.${await toBase64(
				formatSignature(signature)
			)}`;

			console.log(
				"Does the signature match",
				ecdsaVerify(
					scalarMultiply(this.privateKey, G),
					new Uint8Array(await sha256(new TextEncoder().encode(result.token))),
					signature
				)
			);

			console.log(
				[...new TextEncoder().encode(result.token)].map((c) =>
					c.toString(16).padStart(2, "0")
				)
			);
			console.log(
				[...formatSignature(signature)].map((c) =>
					c.toString(16).padStart(2, "0")
				)
			);

			const publicKey = scalarMultiply(this.privateKey, G);
			if (publicKey === pointAtInfinity) {
				return;
			}
			const uncompressed = uncompressedKeyFormat(publicKey);
			const ws = new WebSocket(
				`http://localhost:3030/chat?token=${encodeURIComponent(
					tokenToSend
				)}&public_key=${encodeURIComponent(await toBase64(uncompressed))}`
			);
			ws.addEventListener("message", (e) => {
				try {
					const parsed = JSON.parse(e.data);
					console.log(parsed);
				} catch (e) {
					console.error(e);
				}
			});
			ws.addEventListener("close", (e) => {
				console.log(e);
			});
		});
	}

	disconnect() {
		this.ws?.close();
	}
}

function App() {
	useEffect(() => {
		const connection = new Connection();
		return () => {
			connection.disconnect();
		};
	});

	return <></>;
}

export default App;
