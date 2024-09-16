import { Navigate, useParams } from "react-router-dom";
import { useAppStore } from "./state";

export function ChatWindow() {
	const participants = useAppStore((state) => state.participants);

	const { userId } = useParams();
	if (!userId) {
		return <Navigate to="/" />;
	}

	const idAndParticipant = participants.filter(([id]) => id === userId)[0];
	if (!idAndParticipant) {
		return <Navigate to="/" />;
	}
	const [, participant] = idAndParticipant;

	return (
		<div>
			<div className="px-6 py-2 font-bold border-b">
				{participant.name ?? "Anonymous"}
			</div>
		</div>
	);
}
