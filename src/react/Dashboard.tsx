import * as React from "react";
import { InstanceGrid } from "./Instance/InstanceGrid";
import { Header } from "./Components/Header";
import { Footer } from "./Components/Footer";
import { AddInstanceBtn } from "./Instance/AddInstanceBtn";
import { UsersBtn } from "./Components/Users/UsersBtn";
const ipcRenderer = window.require("electron").ipcRenderer;

export function Dashboard() {
	const setRPC = () => {
		ipcRenderer.send("SET_RPC", {
			details: "In the main menu",
			state: "Viewing the dashboard",
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
					<div className="header-title">MC Launcher</div>
				</div>
				<div className="buttons">
					<UsersBtn />
				</div>
			</Header>
			<InstanceGrid style={{ flexGrow: 1 }} />
			<Footer>
				<div className="info"></div>
				<div className="buttons">
					<AddInstanceBtn />
				</div>
			</Footer>
		</div>
	);
}
