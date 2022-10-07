import * as React from "react";
const { ipcRenderer } = window.require("electron");

export function AddUserBtn(props: any) {
	const addUser = () => {
		ipcRenderer.send("ADD_USER", {});
	};

	return (
		<>
			<div className="add-btn hover-border hover-text" onClick={addUser}>
				+
			</div>
		</>
	);
}
