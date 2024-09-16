import { create } from "zustand";
import { InferType } from "./validator";
import { participantSchema, stateSchema } from "./schema";

export type Participant = InferType<typeof participantSchema>;

export type ParticipantsList = InferType<typeof stateSchema>;

export type AppStoreState = {
	participants: [string, Participant][];
	updateParticipants: (list: ParticipantsList) => void;
};

export const useAppStore = create<AppStoreState>((set) => ({
	participants: [],
	updateParticipants: (list: ParticipantsList) => {
		set(() => ({ participants: list }));
	},
}));
