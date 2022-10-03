import * as React from "react";
const { ipcRenderer } = window.require("electron");

export default function App() {
	const [instance, setInstance] = React.useState(null);
	const [instances, setInstances] = React.useState(null);
	const [uuid, setUUID] = React.useState(null);

	const getInstances = () => {
		ipcRenderer.send("GET_INSTANCES", {});
	};

	const startInstance = () => {
		ipcRenderer.send("START_INSTANCE", { uuid });
	};

	const handleUUIDChange = (event: any) => {
		setUUID(event.target.value);
	};

	React.useEffect(() => {
		ipcRenderer.on("GET_INSTANCES", (event, arg) => {
			console.log(arg);
			setInstances(JSON.stringify(arg.instances));
		});

		return () => {
			ipcRenderer.removeAllListeners("GET_INSTANCE");
			ipcRenderer.removeAllListeners("GET_INSTANCES");
		};
	}, []);

	return (
		<>
			<div>
				<h2>YEET!</h2>
				<button onClick={getInstances}>Get Instances</button>
				<input type="text" placeholder="UUID" name="instance_uuid" onChange={handleUUIDChange} />
				<button onClick={startInstance}>Start Instance</button>
				<div>{instances}</div>
			</div>
		</>
	);
}
