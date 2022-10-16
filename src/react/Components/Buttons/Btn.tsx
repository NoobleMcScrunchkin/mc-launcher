import * as React from "react";

export function Btn(props: any) {
	return (
		<>
			<div style={props.style != undefined ? props.style : {}} onClick={props.onClick} className={"btn hover-border" + (props.className ? ` ${props.className}` : "")}>
				{props.children}
			</div>
		</>
	);
}
