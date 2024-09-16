import { arrayOf, either, exact, object, string, tuple } from "./validator";

export const participantSchema = object({
	name: either(string(), exact(null)),
	keys: arrayOf(string()),
});

export const stateSchema = arrayOf(tuple([string(), participantSchema]));
