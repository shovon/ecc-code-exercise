import { publicKeyFromUncompressed, verify } from "./ecc";

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
