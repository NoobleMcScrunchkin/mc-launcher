import * as React from "react";
import { Btn } from "../Buttons/Btn";
import { LoadingIcon } from "../Overlays/LoadingIcon";
const ipcRenderer = window.require("electron").ipcRenderer;

export function JavaSettings() {
	const [show, setShow] = React.useState<boolean>(false);
	const [loading, setLoading] = React.useState<boolean>(false);
	const [java8Path, setJava8Path] = React.useState<string>("");
	const [java17Path, setJava17Path] = React.useState<string>("");

	const updateSetting = (key: string, value: any) => {
		ipcRenderer.send("SET_SETTING", { key, value });
	};

	const downloadJava = async () => {
		setLoading(true);
		let { java8, java17 } = await ipcRenderer.invoke("DOWNLOAD_JAVA", {});
		setJava8Path(java8);
		setJava17Path(java17);
		setLoading(false);
	};

	React.useEffect(() => {
		(async () => {
			setJava8Path(await ipcRenderer.invoke("GET_SETTING", { key: "java8_path" }));
			setJava17Path(await ipcRenderer.invoke("GET_SETTING", { key: "java17_path" }));
			setShow(true);
		})();
	}, []);

	if (!show) {
		return;
	}

	return (
		<div className={`java-settings ${loading ? "loading" : ""}`}>
			<div className="input-group">
				<Btn onClick={downloadJava}>Download Java</Btn>
			</div>
			<div className="input-group">
				<label htmlFor="java8Path" className="input-label">
					Java 8 Path
				</label>
				<input
					type="text"
					name="java8Path"
					id="java8Path"
					value={java8Path}
					onChange={(e) => {
						updateSetting("java8_path", e.target.value);
						setJava8Path(e.target.value);
					}}
				/>
			</div>
			<div className="input-group">
				<label htmlFor="java17Path" className="input-label">
					Java 17 Path
				</label>
				<input
					type="text"
					name="java17Path"
					id="java17Path"
					value={java17Path}
					onChange={(e) => {
						updateSetting("java17_path", e.target.value);
						setJava17Path(e.target.value);
					}}
				/>
			</div>
			<LoadingIcon />
		</div>
	);
}
