import { publicKeyFromUncompressed, verify } from "./ecc";

// test("verify signature", async () => {
// 	const publicKey =
// 		"BIPvG0bVMnELJFhv/QboND88z+vkhnxrxUZIze1Prj46h69KflEw25FAL6WPCdfw51PFEhSBiwDFQ7ZOWDIjfGY=";
// 	const signature =
// 		"E2pGdHcrmq9uaNtVh1vr+CcAkOh5mO8KTmnC5vpvvozZTpQoxkqzarf4RN3DjYbkj7g4xWmCmPPQD6WP2S0udQ==";
// 	const message = "SGVsbG8sIFdvcmxkIQ";

// 	expect(
// 		await verify(
// 			Buffer.from(publicKey, "base64"),
// 			Buffer.from(signature, "base64"),
// 			Buffer.from(message, "base64")
// 		)
// 	).toBe(true);
// });

// test("parse BIggmIpM8FE/khj8PzhL0fihwFJxucVbSOX/RPV7jFi1AH0uIr1gQWf21ybWvQ9F30dv510F/ym4uV+85nn1XdI=", () => {
// 	publicKeyFromUncompressed(
// 		"BIggmIpM8FE/khj8PzhL0fihwFJxucVbSOX/RPV7jFi1AH0uIr1gQWf21ybWvQ9F30dv510F/ym4uV+85nn1XdI="
// 	);
// });

test("verification", async () => {
	const publicKey =
		"BG/hONmIId/YBBdMEoT/5DZhaciepMP25JeqYVNkzKNM1eooLLahrRrTOmSgQ2jk1+D/72KIwp60bHG0QRby0L8=";
	const signature =
		"ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnpkV0lpT2lKdFNtNHZiSEp0T1ZobFNsTjVNRzgxU2pCd1UzcEtPRWQ2Y0c5dVJXMDFibmxOT1hCb09HWnhOa2ROUFNJc0ltbGhkQ0k2TVRjeU5qTTNOVGcwT1N3aVpYaHdJam94TnpJMk16YzFPVEE1ZlEudXRROHA5QXNyVDE0NC1aU3FoRGxxZjBkV0I5UjkzSWpUaTI0elFibmE3NA==";
	const message =
		"9vyrxaBS3E0yct8YST9cRYabm7ZC8wp7L9lQwdBoPeRiy8zG3ZwrCVRSie4zhwHdsQHbXJzyWvwPCFRO9WkCqg==";

	expect(
		await verify(
			Buffer.from(publicKey, "base64"),
			Buffer.from(signature, "base64"),
			Buffer.from(message, "base64")
		)
	).toBe(true);
});
