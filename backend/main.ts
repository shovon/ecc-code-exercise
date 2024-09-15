import { Server } from "http";
import * as express from "express";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as crypto from "crypto";
import { logger } from "./lib/logger";
import * as cors from "cors";
import * as v from "./lib/validator";
import * as jwt from "jsonwebtoken";
// import { ec } from 'elliptic';
import * as ecc from "./lib/ecc";
import * as cookieParser from "cookie-parser";

const hmacKey = crypto.randomBytes(32);

const wss = new WebSocketServer({ noServer: true });

/**
 * A list of sessions.
 *
 * A single sesion is associated with a cookie (opaque) token.
 *
 * And each opaque token comes with it a specific user, and aech user can have
 * potentially many clients (connections). Each connection *must* be associated
 * with a public keyl.
 */
const sessions = new Map<
	string,
	{
		name: string | null;
		connections: Map<string, WebSocket>;
	}
>();

function getState(): [
	string,
	{
		name: string | null;
		keys: string[];
	}
][] {
	return [...sessions].map(([str, { name, connections }]) => [
		str,
		{ name, keys: [...connections].map(([k]) => k) },
	]);
}

function sendStateUpdate() {
	const state = getState();
	for (const [, { connections }] of sessions) {
		for (const [, connection] of connections) {
			connection.send(
				JSON.stringify({
					type: "STATE",
					data: state,
				})
			);
		}
	}
}

function storeSession(sessionId: string) {
	sessions.set(sessionId, {
		name: null,
		connections: new Map(),
	});
	sendStateUpdate();
}

function setName({ sessionId, name }: { sessionId: string; name: string }) {
	if (!sessions.has(sessionId)) {
		storeSession(sessionId);
	}
	console.assert(sessions.has(sessionId));
	sessions.get(sessionId)!.name = name;
	sendStateUpdate();
}

function addConnection({
	sessionId,
	key,
	connection,
}: {
	sessionId: string;
	key: string;
	connection: WebSocket;
}) {
	if (!sessions.has(sessionId)) {
		storeSession(sessionId);
	}
	console.assert(sessions.has(sessionId));
	sessions.get(sessionId)!.connections.set(key, connection);
	sendStateUpdate();
}

function removeConnection({
	sessionId,
	key,
}: {
	sessionId: string;
	key: string;
}) {
	if (!sessions.has(sessionId)) {
		return;
	}
	console.assert(sessions.has);
	sessions.get(sessionId)?.connections.delete(key);
}

wss.on("connection", function (ws: WebSocket, request: IncomingMessage) {
	// The server will only ever verify the token, and that's it. Nothing else.

	(async () => {
		try {
			const queryParams = new URLSearchParams(
				new URL(`http://nomatter${request.url}`).search
			);

			const tokenAndSignature = queryParams.get("token");
			const publicKey = queryParams.get("public_key");

			if (!tokenAndSignature) {
				ws.send(
					JSON.stringify({
						error: "Invalid token and signature",
					})
				);
				ws.close();
				return;
			}

			const tokenAndSignatureArr = tokenAndSignature.split(".");
			if (tokenAndSignatureArr.length !== 2) {
				ws.send(
					JSON.stringify({
						error: "Invalid token and signature",
					})
				);
				ws.close();
				return;
			}

			if (!publicKey) {
				ws.send(
					JSON.stringify({
						error: "Public key not provided",
					})
				);
				ws.close();
				return;
			}

			const [token, signature] = tokenAndSignatureArr;

			let verified: boolean = false;
			try {
				verified = await ecc.verify(
					Buffer.from(publicKey, "base64"),
					Buffer.from(token, "base64"),
					Buffer.from(signature, "base64")
				);
			} catch (e) {
				logger.error(e);
				ws.send(
					JSON.stringify({
						error: "Failed to parse key",
						keySent: publicKey,
					})
				);
				ws.close();
				return;
			}
			if (!verified) {
				console.log("public key", publicKey);
				console.log("token", token);
				console.log("signature", signature);
				ws.send(
					JSON.stringify({
						error: "Failed to verify",
					})
				);
				ws.close();
				return;
			}

			let payload: string | jwt.JwtPayload;
			try {
				payload = jwt.verify(atob(token), hmacKey);
			} catch (error) {
				ws.send(
					JSON.stringify({
						error: "Failed to verify token",
					})
				);
				ws.close();
				return;
			}

			if (typeof payload === "string") {
				ws.send(
					JSON.stringify({
						error: "Payload is a string not an object",
					})
				);
				ws.close();
				return;
			}

			const sessionId = payload.sub;
			if (!sessionId) {
				ws.send(
					JSON.stringify({
						error: "Failed to set token",
					})
				);
				ws.close();
				return;
			}

			addConnection({ sessionId, key: publicKey, connection: ws });

			logger.info("Client successfully connected");

			ws.on("error", (error) => {
				logger.error("Client connection errored out", error);
				removeConnection({ sessionId, key: publicKey });
			});
			ws.on("message", () => {});
			ws.on("close", () => {
				logger.info("Client closed connection");
				removeConnection({ sessionId, key: publicKey });
			});
		} catch (e) {
			logger.error(e);
			ws.send(
				JSON.stringify({
					message: "Something failed",
				})
			);
			setTimeout(() => {
				ws.close();
			}, 500);
		}
	})();
});

if (!process.env.CORS_ORIGIN) {
	throw new Error("CORS_ORIGIN not set!");
}

const app = express();
app.use(function (req, res, next) {
	logger.info("Request", { method: req.method, url: req.url });
	next();
});
app.use(
	cors({
		origin: (origin, callback) => {
			callback(null, origin ?? "*"); // Allow all origins (returns the request origin or '*')
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);
app.use(cookieParser());

// Generates an insanely short-lived token, typically around 1 minute.
app.post("/connection-token", (req, res) => {
	let sessionToken = req.cookies.session_token;
	if (!sessionToken) {
		console.log("Session token not found");
		sessionToken = crypto.randomBytes(32).toString("base64");
	}

	res.cookie("session_token", sessionToken, {
		// maxAge: 1000 * 60 * 60 * 24 * 400, // 400 days
		httpOnly: true,
		secure: true, // Use true if you're using HTTPS
		sameSite: "none", // This is crucial for cross-origin cookies
	});

	const header = {
		alg: "HS256",
		typ: "JWT",
	};
	const token = jwt.sign({ sub: sessionToken }, hmacKey, {
		algorithm: "HS256",
		header,
		expiresIn: "1m",
	});

	res.set("Content-Type", "application/json");
	res.send(JSON.stringify({ token }));
});

app.get("/healthcheck", (_, res) => {
	res.write(JSON.stringify({ message: "Alive!" }));
});

const server = app.listen(process.env.PORT, function (this: Server) {
	logger.info("Server running", this.address());
});
server.on("upgrade", (req, socket, head) => {
	socket.on("error", console.error);

	wss.handleUpgrade(req, socket, head, (ws) => {
		wss.emit("connection", ws, req);
	});
});
