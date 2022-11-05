import * as React from "react";
import { Instance } from "../../../util/minecraft/game/instance";
import { InstanceIcon } from "./InstanceIcon";
const { ipcRenderer } = window.require("electron");

export function InstanceGrid(props: any) {
	const [instances, setInstances] = React.useState<Array<Instance>>([]);
	const [inprogress, setInprogress] = React.useState<number>(0);

	const getInstances = () => {
		ipcRenderer.send("GET_INSTANCES", {});
	};

	React.useEffect(() => {
		getInstances();

		ipcRenderer.on("GET_INSTANCES", (event, arg) => {
			setInstances(arg.instances);
			setInprogress(arg.inprogress);
		});

		return () => {
			ipcRenderer.removeAllListeners("GET_INSTANCES");
		};
	}, []);

	return (
		<>
			<div style={props.style != undefined ? props.style : {}} className="instance-grid">
				{[...Array(inprogress)].map((e, i) => {
					return <InstanceIcon key={i} loading={true} />;
				})}
				{instances.map((instance: Instance) => {
					return <InstanceIcon key={instance.uuid} instance={instance} />;
				})}
			</div>
		</>
	);
}
