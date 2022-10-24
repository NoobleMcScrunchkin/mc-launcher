import * as React from "react";
import { useInstance } from "../../InstanceSettings";
const ipcRenderer = window.require("electron").ipcRenderer;

export function JavaInstanceSettings() {
	const { instance } = useInstance();
	const [show, setShow] = React.useState<boolean>(false);
	const [jvmArgs, setJvmArgs] = React.useState<string>("");
	const [jvmMemory, setJvmMemory] = React.useState<number>();

	React.useEffect(() => {
		(async () => {
			if (instance) {
				setJvmArgs(instance.custom_jvm_args);

				if (instance.jvm_memory == undefined) {
					setJvmMemory(2048);
					ipcRenderer.send("SET_INSTANCE_SETTING", { uuid: instance.uuid, key: "jvm_memory", value: 2048 });
				} else {
					setJvmMemory(instance.jvm_memory);
				}

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
				<div className="input-label">JVM Memory ({jvmMemory}MB)</div>
			</div>
			<div className="input-group">
				<div className="range-slider" style={{ "--min": 1024, "--max": 32768, "--step": 512, "--value": jvmMemory, "--text-value": `'${jvmMemory}'` } as React.CSSProperties}>
					<input
						type="range"
						name="jvmMemory"
						id="jvmMemory"
						value={jvmMemory}
						min="1024"
						max="32768"
						step="512"
						onChange={(e) => {
							setJvmMemory(parseInt(e.target.value));
							ipcRenderer.send("SET_INSTANCE_SETTING", { uuid: instance.uuid, key: "jvm_memory", value: e.target.value });
						}}
						onInput={(e) => {
							((e.target as HTMLElement).parentNode as HTMLElement).style.setProperty("--value", (e.target as HTMLInputElement).value);
							((e.target as HTMLElement).parentNode as HTMLElement).style.setProperty("--text-value", JSON.stringify((e.target as HTMLInputElement).value));
						}}
					/>
					<output></output>
					<div className="range-slider__progress"></div>
				</div>
			</div>
			<div className="input-group">
				<label htmlFor="type" className="input-label">
					Custom JVM Arguments
				</label>
				<input
					type="text"
					name="jvmArgs"
					id="jvmArgs"
					value={jvmArgs}
					onChange={(e) => {
						setJvmArgs(e.target.value);
						ipcRenderer.send("SET_INSTANCE_SETTING", { uuid: instance.uuid, key: "custom_jvm_args", value: e.target.value });
					}}
				/>
			</div>
		</>
	);
}
