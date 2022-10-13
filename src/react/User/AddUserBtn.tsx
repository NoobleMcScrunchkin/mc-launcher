import * as React from "react";
const { ipcRenderer } = window.require("electron");

export function AddUserBtn(props: any) {
	const addUser = () => {
		ipcRenderer.send("ADD_USER", {});
		props.loading("loading");
	};

	return (
		<>
			<div className="add-btn hover-border hover-text" onClick={addUser}>
				<i className="fa-solid fa-plus"></i>
			</div>
		</>
	);
}
