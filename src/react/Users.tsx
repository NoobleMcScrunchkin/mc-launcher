import * as React from "react";
import { CloseBtn } from "./Components/Buttons/CloseBtn";
import { Header } from "./Components/Header";
import { Footer } from "./Components/Footer";
import { LoadingIcon } from "./Components/Overlays/LoadingIcon";
import { UsersList } from "./Components/Users/UsersList";
import { AddUserBtn } from "./Components/Users/AddUserBtn";
const ipcRenderer = window.require("electron").ipcRenderer;

export function Users() {
	const [mainLoading, setMainLoading] = React.useState("");

	const setRPC = () => {
		ipcRenderer.send("SET_RPC", {
			details: "Viewing user profiles",
			state: "Choosing a user to play as",
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
		<div id="main-content" className={mainLoading}>
			<Header className="loading-dim">
				<div className="info">
					<div className="header-title">Users</div>
				</div>
				<CloseBtn />
			</Header>
			<UsersList className="loading-dim" style={{ flexGrow: 1 }} loading={setMainLoading} />
			<Footer className="loading-dim">
				<div className="info"></div>
				<div className="buttons">
					<AddUserBtn loading={setMainLoading} />
				</div>
			</Footer>
			<LoadingIcon />
		</div>
	);
}
