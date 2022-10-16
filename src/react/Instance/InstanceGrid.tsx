import * as React from "react";
import { Instance } from "../../util/minecraft/game/instance";
import { InstanceIcon } from "./InstanceIcon";
const { ipcRenderer } = window.require("electron");

export function InstanceGrid(props: any) {
	const [instances, setInstances] = React.useState([]);

	const getInstances = () => {
		ipcRenderer.send("GET_INSTANCES", {});
	};

	React.useEffect(() => {
		getInstances();

		ipcRenderer.on("GET_INSTANCES", (event, arg) => {
			setInstances(arg.instances);
		});

		return () => {
			ipcRenderer.removeAllListeners("GET_INSTANCES");
		};
	}, []);

	return (
		<>
			<div style={props.style != undefined ? props.style : {}} className="instance-grid">
				{instances.map((instance: Instance) => {
					return <InstanceIcon key={instance.uuid} instance={instance} />;
				})}
			</div>
		</>
	);
}
