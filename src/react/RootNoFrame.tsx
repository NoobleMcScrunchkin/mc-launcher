import * as React from "react";
import { Outlet } from "react-router-dom";

export function RootNoFrame(props: any) {
	return (
		<>
			<div id="react-root">
				<Outlet />
				{props.children}
			</div>
		</>
	);
}
