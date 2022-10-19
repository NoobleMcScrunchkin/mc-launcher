import * as React from "react";

export function SettingsSidebar(props: any) {
	return (
		<>
			<div className="setting-sidebar">
				<div className={`setting-sidebar-item hover-text` + (props.currentPage == "general" ? " active" : "")}>General</div>
			</div>
		</>
	);
}
