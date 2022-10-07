import * as React from "react";
import { CloseBtn } from "./Components/CloseBtn";
import { Btn } from "./Components/Btn";
import { useNavigate } from "react-router-dom";
const { ipcRenderer } = window.require("electron");

export function InstanceCreator() {
	const navigate = useNavigate();

	const [name, setName] = React.useState("");
	const [type, setType] = React.useState("vanilla");
	const [version, setVersion] = React.useState("");

	const handleNameChange = (event: any) => {
		setName(event.target.value);
	};

	const handleTypeChange = (event: any) => {
		setType(event.target.value);
	};

	const handleVersionChange = (event: any) => {
		setVersion(event.target.value);
	};

	const createInstance = () => {
		ipcRenderer.send("CREATE_INSTANCE", { name, type, version });
		navigate("/");
	};

	return (
		<>
			<CloseBtn />
			<div className="instance-creator">
				<div className="title">Create Instance</div>
				<div className="input-group">
					<label htmlFor="name">Name</label>
					<input type="text" name="name" id="name" value={name} onChange={handleNameChange} />
				</div>
				<div className="input-group">
					<label htmlFor="type">Type</label>
					<input type="text" name="type" id="type" value={type} onChange={handleTypeChange} />
				</div>
				<div className="input-group">
					<label htmlFor="version">Version</label>
					<input type="text" name="version" id="version" value={version} onChange={handleVersionChange} />
				</div>

				<Btn style={{ marginTop: "1rem" }} onClick={createInstance}>
					Create
				</Btn>
			</div>
		</>
	);
}
