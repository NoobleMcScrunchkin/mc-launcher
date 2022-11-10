import * as React from "react";
import { useInstance } from "../../InstanceSettings";
import { Btn } from "../Buttons/Btn";
import { Link } from "react-router-dom";
const ipcRenderer = window.require("electron").ipcRenderer;

export function GeneralInstanceSettings() {
	const { instance, setInstance, updateInstance } = useInstance();
	const [show, setShow] = React.useState<boolean>(false);
	const [instanceName, setInstanceName] = React.useState<string>();

	React.useEffect(() => {
		(async () => {
			if (instance) {
				setInstanceName(instance.name);

				setShow(true);
			}
		})();
	}, [instance]);

	if (!show) {
		return;
	}

	return (
		<>
			<div className="input-group">
				<label htmlFor="type" className="input-label">
					Instance Name
				</label>
				<input
					type="text"
					name="instanceName"
					id="instanceName"
					value={instanceName}
					onChange={(e) => {
						setInstanceName(e.target.value);
						let newInstance = instance;
						newInstance.name = e.target.value;
						setInstance(newInstance);
						ipcRenderer.send("SET_INSTANCE_SETTING", { uuid: newInstance.uuid, key: "name", value: e.target.value });
						updateInstance();
					}}
				/>
			</div>
			<div className="input-group input-group-inline">
				<div className="input-label">{instance.modpack ? `${instance.modpack_info.name.replace(".zip", "")}` : `Minecraft Version (${instance.type} ${instance.type != "vanilla" ? `- ${instance.loader_version}` : ""} - ${instance.version})`}</div>
				<div className="input">
					<Link to={`/instanceUpdater/${instance.uuid}`}>
						<Btn style={{ fontSize: "1rem", padding: "0.5rem" }}>Change Version</Btn>
					</Link>
				</div>
			</div>
		</>
	);
}
