import { publicKeyFromUncompressed, verify } from "./ecc";

test("verify signature", () => {
	const publicKey =
		"BIPvG0bVMnELJFhv/QboND88z+vkhnxrxUZIze1Prj46h69KflEw25FAL6WPCdfw51PFEhSBiwDFQ7ZOWDIjfGY=";
	const signature =
		"E2pGdHcrmq9uaNtVh1vr+CcAkOh5mO8KTmnC5vpvvozZTpQoxkqzarf4RN3DjYbkj7g4xWmCmPPQD6WP2S0udQ==";
	const message = "SGVsbG8sIFdvcmxkIQ";

	expect(
		verify(
			publicKeyFromUncompressed(publicKey),
			Buffer.from(signature, "base64"),
			Buffer.from(message, "base64")
		)
	);
});

test("parse BIggmIpM8FE/khj8PzhL0fihwFJxucVbSOX/RPV7jFi1AH0uIr1gQWf21ybWvQ9F30dv510F/ym4uV+85nn1XdI=", () => {
	publicKeyFromUncompressed(
		"BIggmIpM8FE/khj8PzhL0fihwFJxucVbSOX/RPV7jFi1AH0uIr1gQWf21ybWvQ9F30dv510F/ym4uV+85nn1XdI="
	);
});
