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
import { ecdsaSign, formatSignature, uncompressedKeyFormat } from "./ecc";

function App() {
	useEffect(() => {
		console.log("hmm");
		fetch("http://localhost:3030/connection-token", { method: "POST" }).then(
			async (response) => {
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
				const key = generateSafeScalar();
				const signature = await toBase64(
					formatSignature(
						ecdsaSign(
							key,
							new Uint8Array(
								await sha256(new TextEncoder().encode(result.token))
							)
						)
					)
				);
				const payload = btoa(result.token);
				const tokenToSend = `${payload}.${signature}`;

				const publicKey = scalarMultiply(key, G);
				if (publicKey === pointAtInfinity) {
					return;
				}
				const uncompressed = uncompressedKeyFormat(publicKey);
				console.log(key);
				console.log(publicKey);
				console.log(await toBase64(uncompressed));
				const ws = new WebSocket(
					`http://localhost:3030/chat?token=${encodeURIComponent(
						tokenToSend
					)}&public_key=${encodeURIComponent(await toBase64(uncompressed))}`
				);
				ws.addEventListener("message", (e) => {
					console.log(e.data);
				});
				ws.addEventListener("close", (e) => {
					console.log(e);
				});
			}
		);
	});

	return <>Sweet</>;
}

export default App;
