import * as React from "react";
import { Link } from "react-router-dom";

export function Btn(props: any) {
	return (
		<>
			<div style={props.style} onClick={props.onClick} className="btn hover-border">
				{props.children}
			</div>
		</>
	);
}
