import * as React from "react";
const ipcRenderer = window.require("electron").ipcRenderer;

export function GeneralSettings() {
	const [show, setShow] = React.useState<boolean>(false);
	const [log, setLog] = React.useState<boolean>(false);

	const updateSetting = (key: string, value: any) => {
		ipcRenderer.send("SET_SETTING", { key, value });
	};

	React.useEffect(() => {
		(async () => {
			setLog(await ipcRenderer.invoke("GET_SETTING", { key: "open_log_on_launch" }));
			setShow(true);
		})();
	}, []);

	if (!show) {
		return;
	}

	return (
		<>
			<div className="input-group input-group-inline">
				<div className="input-label">Open Log on Launch</div>
				<div className="input">
					<label className="switch">
						<input
							type="checkbox"
							checked={log}
							onChange={() => {
								updateSetting("open_log_on_launch", !log);
								setLog(!log);
							}}
						/>
						<span className="slider round"></span>
					</label>
				</div>
			</div>
		</>
	);
}
