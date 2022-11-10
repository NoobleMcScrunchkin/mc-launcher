import * as React from "react";
import { Link } from "react-router-dom";

export function InstanceSettingsSidebar(props: any) {
	return (
		<>
			<div className="setting-sidebar">
				<Link to={"/instanceSettings/" + props.uuid + "/general"}>
					<div className={`setting-sidebar-item hover-text` + (props.currentPage == "general" ? " active" : "")}>General</div>
				</Link>
				<Link to={"/instanceSettings/" + props.uuid + "/java"}>
					<div className={`setting-sidebar-item hover-text` + (props.currentPage == "java" ? " active" : "")}>Java</div>
				</Link>
				{props.modded && (
					<Link to={"/instanceSettings/" + props.uuid + "/mods"}>
						<div className={`setting-sidebar-item hover-text` + (props.currentPage == "mods" ? " active" : "")}>Mods</div>
					</Link>
				)}
			</div>
		</>
	);
}
