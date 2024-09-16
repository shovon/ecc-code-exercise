import { useEffect, useState } from "react";
import {
	isValidPublicKey,
	parseUncompressed,
	schemeEncrypt,
	schemeVerifyAndDecrypt,
	uncompressedKeyFormat,
} from "./ecc";
import {
	G,
	generateSafeScalar,
	pointAtInfinity,
	scalarMultiply,
} from "./secp256r1";
import { fromBase64, toBase64 } from "./uint8array";

const privateKey = generateSafeScalar();
const publicKeyPoint = scalarMultiply(privateKey, G);
if (publicKeyPoint === pointAtInfinity) {
	throw new Error("Public key is point at infinity!");
}
const publicKey = publicKeyPoint;
const publicKeyBase64 = toBase64(uncompressedKeyFormat(publicKey));

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

function App() {
	const [otherPublicKeyBase64, setOtherPublicKeyBase64] = useState("");
	const [isOtherPublicKeyValid, setIsOtherPublicKeyValid] = useState(false);
	const [ourMessage, setOurMessage] = useState("");
	const [ourEncryptedMessage, setOurEncryptedMessage] = useState("");
	const [theirCiphertext, setTheirCiphertext] = useState("");
	const [decryptResult, setDecryptResult] = useState<
		UnwrapPromise<ReturnType<typeof schemeVerifyAndDecrypt>>
	>({
		message: null,
		valid: false,
	});

	useEffect(() => {
		(async () => {
			setIsOtherPublicKeyValid(await isValidPublicKey(otherPublicKeyBase64));
		})().catch(console.error);
	}, [otherPublicKeyBase64]);

	useEffect(() => {
		(async () => {
			if (!isOtherPublicKeyValid) {
				return;
			}
			const encryption = await schemeEncrypt(
				privateKey,
				parseUncompressed(await fromBase64(otherPublicKeyBase64)),
				new TextEncoder().encode(ourMessage)
			);
			setOurEncryptedMessage(encryption);
		})().catch(console.error);
	}, [ourMessage, isOtherPublicKeyValid, otherPublicKeyBase64]);

	useEffect(() => {
		(async () => {
			setDecryptResult(
				await schemeVerifyAndDecrypt(
					parseUncompressed(await fromBase64(otherPublicKeyBase64)),
					privateKey,
					theirCiphertext
				)
			);
		})().catch(console.error);
	}, [theirCiphertext, otherPublicKeyBase64]);

	return (
		<div className="flex">
			<div className="flex-1 p-4">
				<h3 className="mb-2 font-bold">Your public key</h3>
				<input
					className="public-key-input"
					type="text"
					onMouseDown={() => {
						navigator.clipboard.writeText(publicKeyBase64);
					}}
					readOnly
					value={publicKeyBase64}
				></input>
				<h3 className="font-bold mb-2">Your message</h3>
				<textarea
					className="textarea"
					value={ourMessage}
					onChange={(e) => {
						setOurMessage(e.target.value);
					}}
				></textarea>
				<h3 className="font-bold mb-2 mt-3">Your message encrypted</h3>
				{isOtherPublicKeyValid ? (
					<textarea
						className="textarea"
						value={ourEncryptedMessage}
						readOnly
					></textarea>
				) : (
					<div className="text-red-500">
						Can't encrypt without their public key
					</div>
				)}
			</div>
			<div className="flex-1 p-4">
				<h3 className="mb-2 font-bold">Their public key</h3>
				<input
					className="public-key-input"
					type="text"
					value={otherPublicKeyBase64}
					onChange={(e) => {
						setOtherPublicKeyBase64(e.target.value);
					}}
				/>
				<h3 className="font-bold mb-2">Their ciphertext</h3>
				<textarea
					className="textarea"
					value={theirCiphertext}
					onChange={(e) => {
						setTheirCiphertext(e.target.value);
					}}
				></textarea>
				<h3 className="font-bold mb-2 mt-3">Their message decrypted</h3>
				{isOtherPublicKeyValid ? (
					decryptResult.valid ? (
						<textarea
							className="textarea"
							value={new TextDecoder().decode(decryptResult.message)}
							readOnly
						></textarea>
					) : (
						<div className="text-red-500">
							Can't decrypt without a valid ciphertext
						</div>
					)
				) : (
					<div className="text-red-500">
						Can't decrypt without the other party's valid public key
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
