import * as React from "react";

export function Header(props: any) {
	return (
		<div id="header" className={props.className != undefined ? props.className : ""}>
			{props.children}
		</div>
	);
}
