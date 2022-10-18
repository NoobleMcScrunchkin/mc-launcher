import * as React from "react";
import { Outlet } from "react-router-dom";

export function RootNoFrame() {
	return (
		<>
			<div id="react-root">
				<Outlet />
			</div>
		</>
	);
}
