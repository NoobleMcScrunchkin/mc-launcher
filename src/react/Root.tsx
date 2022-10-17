import * as React from "react";
import { Outlet } from "react-router-dom";
import { Popup } from "./Components/Popup";

export function Root() {
	return (
		<>
			<Outlet />
			<Popup id="error" title="Error">
				Default error message
			</Popup>
		</>
	);
}
