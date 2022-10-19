import * as React from "react";
import { Header } from "./Components/Header";
import { CloseBtn } from "./Components/Buttons/CloseBtn";
import { SettingsSidebar } from "./Components/Settings/SettingsSidebar";
import { Outlet, useLocation } from "react-router-dom";
const ipcRenderer = window.require("electron").ipcRenderer;

export function Settings(props: any) {
	const location = useLocation();
	const locationStr = location.pathname.split("/")[2];

	const setRPC = () => {
		ipcRenderer.send("SET_RPC", {
			details: "In the settings menu",
			state: "Changing settings",
			largeImageKey: "rainbow_clouds",
			largeImageText: "Custom Launcher",
			smallImageKey: "rainbow_clouds",
			smallImageText: "Getting ready to play some Minecraft",
		});
	};

	React.useEffect(() => {
		setRPC();

		ipcRenderer.addListener("SET_RPC", (event, arg) => {
			setRPC();
		});

		return () => {
			ipcRenderer.removeAllListeners("SET_RPC");
		};
	}, []);

	return (
		<div id="main-content">
			<Header>
				<div className="info">
					<div className="header-title">Settings</div>
				</div>
				<div className="buttons">
					<CloseBtn />
				</div>
			</Header>
			<div className="settings-container">
				<SettingsSidebar currentPage={locationStr} />
				<div className="settings-content">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
