import { predicate, string } from "./validator";

export const email = () =>
	predicate(string(), (v) =>
		/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(v)
	);
