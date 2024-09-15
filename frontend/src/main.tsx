import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				path: "/",
				element: (
					<div className="absolute top-0 left-0 right-0 bottom-0 text-center mt-11">
						Please select a chat on the left
					</div>
				),
			},
			{
				path: "/chat/:chatId",
				element: <div>Chat window</div>,
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
);
