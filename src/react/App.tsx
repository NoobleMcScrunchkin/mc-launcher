import * as React from "react";
const { ipcRenderer } = window.require("electron");

export default function App() {
	const [instance, setInstance] = React.useState(null);
	const [instances, setInstances] = React.useState(null);
	const [uuid, setUUID] = React.useState(null);
	const [name, setName] = React.useState("");
	const [type, setType] = React.useState("vanilla");
	const [version, setVersion] = React.useState("");

	const getInstances = () => {
		ipcRenderer.send("GET_INSTANCES", {});
	};

	const startInstance = () => {
		ipcRenderer.send("START_INSTANCE", { uuid });
	};

	const handleUUIDChange = (event: any) => {
		setUUID(event.target.value);
	};

	const handleNameChange = (event: any) => {
		setName(event.target.value);
	};

	const handleTypeChange = (event: any) => {
		console.log(1);
		setType(event.target.value);
	};

	const handleVersionChange = (event: any) => {
		setVersion(event.target.value);
	};

	const createInstance = (event: any) => {
		ipcRenderer.send("CREATE_INSTANCE", { name, type, version });
	};

	React.useEffect(() => {
		getInstances();

		ipcRenderer.on("GET_INSTANCES", (event, arg) => {
			setInstances(JSON.stringify(arg.instances));
		});

		return () => {
			ipcRenderer.removeAllListeners("START_INSTANCE");
			ipcRenderer.removeAllListeners("GET_INSTANCES");
		};
	}, []);

	return (
		<>
			<div>
				<h2>YEET!</h2>
				<button onClick={getInstances}>Get Instances</button>
				<br />
				<input type="text" placeholder="UUID" name="instance_uuid" onChange={handleUUIDChange} />
				<button onClick={startInstance}>Start Instance</button>
				<br />
				<input type="text" placeholder="Instance Name" name="name" onChange={handleNameChange} />
				<select name="type" value={type} onChange={handleTypeChange}>
					<option value="vanilla">Vanilla</option>
					<option value="fabric">Fabric</option>
					<option value="forge">Forge</option>
				</select>
				<input type="text" placeholder="Version" name="version" onChange={handleVersionChange} />
				<button onClick={createInstance}>Create Instance</button>
				<div>{instances}</div>
			</div>
		</>
	);
}
