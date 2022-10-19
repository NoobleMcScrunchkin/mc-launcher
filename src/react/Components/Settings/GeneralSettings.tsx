import * as React from "react";
const ipcRenderer = window.require("electron").ipcRenderer;

export function GeneralSettings() {
	React.useEffect(() => {
		(async () => {
			console.log(await ipcRenderer.invoke("GET_SETTING", { key: "open_log_on_launch" }));
		})();
	}, []);
	return (
		<>
			<div>{}</div>
		</>
	);
}
