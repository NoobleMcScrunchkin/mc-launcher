import * as React from "react";
import { useInstance } from "../../InstanceSettings";
import { Btn } from "../Buttons/Btn";
const ipcRenderer = window.require("electron").ipcRenderer;

export function GeneralInstanceSettings() {
	const { instance } = useInstance();
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
						ipcRenderer.send("SET_INSTANCE_SETTING", { uuid: instance.uuid, key: "name", value: e.target.value });
					}}
				/>
			</div>
			<div className="input-group input-group-inline">
				<div className="input-label">
					Minecraft Version ({instance.type} - {instance.loader_version} - {instance.version})
				</div>
				<div className="input">
					<Btn style={{ fontSize: "1rem", padding: "0.5rem" }}>Change Version</Btn>
				</div>
			</div>
		</>
	);
}
