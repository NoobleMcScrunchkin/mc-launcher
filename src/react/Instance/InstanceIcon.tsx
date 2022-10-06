import * as React from "react";
import { Instance } from "../../util/minecraft/game/instance";
const { ipcRenderer } = window.require("electron");

export function InstanceIcon(props: any) {
	let instance: Instance = props.instance;

	const startGame = () => {
		ipcRenderer.send("START_INSTANCE", { uuid: instance.uuid });
	};

	React.useEffect(() => {
		return () => {
			ipcRenderer.removeAllListeners("START_INSTANCE");
		};
	}, []);

	return (
		<>
			<div className="instance-icon">
				<div className="instance-container hover-border hover-text" onClick={startGame}>
					<div className="instance-name">{instance.name}</div>
				</div>
			</div>
		</>
	);
}
