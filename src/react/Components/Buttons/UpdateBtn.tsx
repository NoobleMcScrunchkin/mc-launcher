import * as React from "react";
const { ipcRenderer } = window.require("electron");

export function UpdateBtn(props: any) {
	return (
		<div
			style={{ cursor: "pointer", ...props.style }}
			className="settings-btn hover-text"
			onClick={() => {
				ipcRenderer.send("DO_UPDATE");
			}}>
			<i className="fa-solid fa-download"></i>
		</div>
	);
}
