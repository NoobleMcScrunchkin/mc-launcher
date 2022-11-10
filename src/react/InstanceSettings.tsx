import * as React from "react";
import { Header } from "./Components/Header";
import { CloseBtn } from "./Components/Buttons/CloseBtn";
import { InstanceSettingsSidebar } from "./Components/Instance/InstanceSettingsSidebar";
import { Outlet, useOutletContext, useLocation, useParams } from "react-router-dom";
import { Instance } from "../util/minecraft/game/instance";
const ipcRenderer = window.require("electron").ipcRenderer;

type ContextType = { instance: Instance | null; setInstance: React.Dispatch<React.SetStateAction<Instance>> | null; updateInstance: () => void | null };

export function InstanceSettings(props: any) {
	const location = useLocation();
	const locationStr = location.pathname.split("/")[3];
	const { uuid } = useParams<{ uuid: string }>();
	const [instance, setInstance] = React.useState<Instance>(null);

	const setRPC = () => {
		ipcRenderer.send("SET_RPC", {
			details: "Editing an Instance",
			state: "Changing settings",
			largeImageKey: "rainbow_clouds",
			largeImageText: "Custom Launcher",
			smallImageKey: "rainbow_clouds",
			smallImageText: "Getting ready to play some Minecraft",
		});
	};

	const updateInstance = async () => {
		setInstance(await ipcRenderer.invoke("GET_INSTANCE", { uuid }));
	};

	React.useEffect(() => {
		setRPC();

		if (instance == null) {
			(async () => {
				setInstance(await ipcRenderer.invoke("GET_INSTANCE", { uuid }));
			})();
		}

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
					<div className="header-title">{instance ? instance.name : ""}</div>
				</div>
				<div className="buttons">
					<CloseBtn />
				</div>
			</Header>
			<div className="settings-container">
				<InstanceSettingsSidebar currentPage={locationStr} uuid={instance ? instance.uuid : ""} modded={instance ? instance.type != "vanilla" : false} />
				<div className="settings-content">
					<Outlet context={{ instance, setInstance, updateInstance }} />
				</div>
			</div>
		</div>
	);
}

export function useInstance() {
	return useOutletContext<ContextType>();
}
