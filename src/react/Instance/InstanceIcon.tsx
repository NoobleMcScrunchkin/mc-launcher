import * as React from "react";
import { Instance } from "../../util/minecraft/game/instance";
import { LoadingIcon } from "../Components/LoadingIcon";
const { ipcRenderer } = window.require("electron");

export function InstanceIcon(props: any) {
	const [loading, setLoading] = React.useState("");
	let instance: Instance = props.instance;

	const startGame = () => {
		if (loading == "") {
			ipcRenderer.send("START_INSTANCE", { uuid: instance.uuid });
			setLoading("loading");
		}
	};

	React.useEffect(() => {
		ipcRenderer.on("INSTANCE_STARTED", (event, args) => {
			if (args.uuid == instance.uuid) {
				setLoading("");
			}
		});

		ipcRenderer.on("INSTANCE_START_ERROR", (event, args) => {
			if (args.uuid == instance.uuid) {
				setLoading("");
			}
		});

		return () => {
			ipcRenderer.removeAllListeners("INSTANCE_STARTED");
			ipcRenderer.removeAllListeners("INSTANCE_START_ERROR");
		};
	}, []);

	return (
		<>
			<div className={`instance-icon ${loading}`}>
				<div className={`instance-container hover-border hover-text loading-dim`} onClick={startGame}>
					<div className="instance-name">{instance.name}</div>
				</div>
				<LoadingIcon />
			</div>
		</>
	);
}
