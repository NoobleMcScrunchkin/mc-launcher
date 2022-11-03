import * as React from "react";
import { Outlet } from "react-router-dom";
import { Popup } from "./Components/Popup";
const { ipcRenderer } = window.require("electron");

export function Root(props: any) {
	const minimize = () => {
		ipcRenderer.send("MINIMIZE");
	};
	const maximize = () => {
		ipcRenderer.send("MAXIMIZE");
	};
	const close = () => {
		ipcRenderer.send("CLOSE");
	};

	return (
		<>
			<div id="title-bar">
				<div id="title">Custom Minecraft Launcher</div>
				<div id="title-bar-btns">
					<div id="min-btn" onClick={minimize}>
						<i className="fa-solid fa-angle-down"></i>
					</div>
					<div id="max-btn" onClick={maximize}>
						<i className="fa-solid fa-angle-up"></i>
					</div>
					<div id="close-btn" onClick={close}>
						<i className="fa-solid fa-xmark"></i>
					</div>
				</div>
			</div>
			<div id="react-root">
				<Outlet />
				{props.children}
				<Popup id="error" title="Error">
					Default error message
				</Popup>
			</div>
		</>
	);
}
