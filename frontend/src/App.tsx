import { useEffect, useMemo, useRef, useState } from "react";

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
import { NavLink, Outlet } from "react-router-dom";
import { ParticipantsList, useAppStore } from "./state";
import { object, string, unknown, validate } from "./validator";
import { stateSchema } from "./schema";

type Listener<V> = (v: V) => void;

function createSubject<V>() {
	const listeners = new Set<Listener<V>>();
	return {
		emit: (value: V) => {
			for (const listener of listeners) {
				listener(value);
			}
		},
		subscribe: (listener: Listener<V>) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

function createOnce<V>() {
	let listeners: Set<Listener<V>> | null = new Set<Listener<V>>();
	return {
		emit: (value: V) => {
			if (!listeners) return;
			for (const listener of listeners) {
				listener(value);
			}
			listeners = null;
		},
		subscribe: (listener: Listener<V>) => {
			listeners?.add(listener);
			return () => listeners?.delete(listener);
		},
	};
}

function onceToPromise<V>(once: ReturnType<typeof createOnce<V>>) {
	return new Promise<V>((resolve) => {
		once.subscribe(resolve);
	});
}

const serverMessage = object({
	type: string(),
	data: unknown(),
});

class Connection {
	private privateKey = generateSafeScalar();
	private ws: WebSocket | null = null;
	private subject = createSubject<ParticipantsList>();
	private ourIdOnce = createOnce<string>();
	private _ourIdPromise = onceToPromise<string>(this.ourIdOnce);

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

			this.ourIdOnce.emit(JSON.parse(atob(result.token.split(".")[1])).sub);

			const signature = ecdsaSign(
				this.privateKey,
				new Uint8Array(await sha256(new TextEncoder().encode(result.token)))
			);
			const tokenToSend = `${btoa(result.token)}.${await toBase64(
				formatSignature(signature)
			)}`;

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
			this.ws = ws;
			ws.addEventListener("message", (e) => {
				try {
					const parsed = JSON.parse(e.data);
					console.log(parsed);
					const message = validate(serverMessage, parsed);
					switch (message.type) {
						case "STATE":
							this.subject.emit(validate(stateSchema, message.data));
							break;
					}
				} catch (e) {
					console.error(e);
				}
			});
			ws.addEventListener("open", () => {});
			ws.addEventListener("close", (e) => {
				console.log(e);
			});
		});
	}

	setName(name: string) {
		this.ws?.send(
			JSON.stringify({
				type: "SET_NAME",
				data: name,
			})
		);
	}

	get onIDSet(): Promise<string> {
		return this._ourIdPromise;
	}

	onStateChange(listener: (v: ParticipantsList) => void) {
		this.subject.subscribe(listener);
	}

	disconnect() {
		this.ws?.close();
	}
}

function NameForm({ onNameSet }: { onNameSet: (value: string) => void }) {
	const [value, setValue] = useState("");
	return (
		<div>
			<h1>Enter a name</h1>
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						return onNameSet(value);
					}
				}}
			/>
		</div>
	);
}

function App() {
	const updateParticipants = useAppStore((state) => state.updateParticipants);
	const [ourId, setOurId] = useState<string | null>(null);
	const allParticipants = useAppStore((state) => state.participants);
	const participants = useMemo(
		() => allParticipants.filter(([id, { name }]) => id !== ourId && !!name),
		[allParticipants, ourId]
	);
	const name = useAppStore(
		(state) => state.participants.filter(([id]) => id === ourId)?.[0]?.[1]?.name
	);
	const connectionRef = useRef<Connection | null>(null);

	useEffect(() => {
		const connection = new Connection();
		connectionRef.current = connection;
		connection.onStateChange(updateParticipants);
		connection.onIDSet.then(setOurId);
		return () => {
			connection?.disconnect();
		};
	}, [updateParticipants]);

	if (!ourId) {
		return <div></div>;
	}

	if (!name) {
		return (
			<div>
				<NameForm
					onNameSet={(name) => {
						connectionRef.current?.setName(name);
					}}
				/>
			</div>
		);
	}

	return (
		<div className="flex">
			<div className="border-gray-200 border-r h-screen w-[200px]">
				<div className="font-bold px-6 py-4">Chats</div>
				{participants.map(([id, participant]) => (
					<NavLink
						className="text-ellipsis"
						to={`/chat/${encodeURIComponent(id)}`}
					>
						<div className="px-6 py-4 border-y border-solid" key={id}>
							{participant.name ?? "Anonymous"}
						</div>
					</NavLink>
				))}
			</div>
			<div className="flex-1 relative">
				<Outlet />
			</div>
		</div>
	);
}

export default App;
