import * as React from "react";
import { Link } from "react-router-dom";

export function SettingsBtn(props: any) {
	return (
		<Link to={"/settings/general"}>
			<div style={props.style} className="settings-btn hover-text">
				<i className="fa-solid fa-gear"></i>
			</div>
		</Link>
	);
}
