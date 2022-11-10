import * as React from "react";
import { Link } from "react-router-dom";

export function SettingsSidebar(props: any) {
	return (
		<>
			<div className="setting-sidebar">
				<Link to={"/settings/general"}>
					<div className={`setting-sidebar-item hover-text` + (props.currentPage == "general" ? " active" : "")}>General</div>
				</Link>
				<Link to={"/settings/java"}>
					<div className={`setting-sidebar-item hover-text` + (props.currentPage == "java" ? " active" : "")}>Java</div>
				</Link>
			</div>
		</>
	);
}
