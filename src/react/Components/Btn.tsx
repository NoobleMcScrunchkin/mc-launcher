import * as React from "react";

export function Btn(props: any) {
	return (
		<>
			<div style={props.style != undefined ? props.style : {}} onClick={props.onClick} className={(props.className != undefined ? props.className : "") + " btn hover-border"}>
				{props.children}
			</div>
		</>
	);
}
