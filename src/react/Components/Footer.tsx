import * as React from "react";

export function Footer(props: any) {
	return (
		<div id="footer" className={props.className != undefined ? props.className : ""}>
			{props.children}
		</div>
	);
}
