import * as React from "react";
import { InstanceGrid } from "./Components/Instance/InstanceGrid";
import { Header } from "./Components/Header";
import { Footer } from "./Components/Footer";
import { AddInstanceBtn } from "./Components/Instance/AddInstanceBtn";
import { UsersBtn } from "./Components/Users/UsersBtn";
import { SettingsBtn } from "./Components/Settings/SettingsBtn";
import { UpdateBtn } from "./Components/Buttons/UpdateBtn";
const ipcRenderer = window.require("electron").ipcRenderer;

export function Dashboard() {
	const [updateDownloaded, setUpdateDownloaded] = React.useState<boolean>(false);

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

		let interval = setInterval(async () => {
			setUpdateDownloaded(await ipcRenderer.invoke("GET_UPDATED_DOWNLOADED"));
		}, 5000);

		ipcRenderer.addListener("SET_RPC", (event, arg) => {
			setRPC();
		});

		return () => {
			ipcRenderer.removeAllListeners("SET_RPC");
			clearInterval(interval);
		};
	}, []);

	return (
		<div id="main-content">
			<Header>
				<div className="info">
					<div className="header-title">MC Launcher</div>
				</div>
				<div className="buttons">
					{updateDownloaded && <UpdateBtn />}
					<SettingsBtn />
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
