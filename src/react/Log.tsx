import * as React from "react";
const ipcRenderer = window.require("electron").ipcRenderer;

export function Log() {
	const [logs, setLogs] = React.useState<React.ReactElement>(null);

	const handleGameLog = (event: CustomEvent) => {
		console.log(event.detail);
		setLogs(
			<>
				{logs}
				<div>{event.detail}</div>
			</>
		);
	};

	React.useEffect(() => {
		window.addEventListener("gamelog", handleGameLog);

		return () => {
			window.removeEventListener("gamelog", handleGameLog);
		};
	}, [logs]);

	return (
		<div id="main-content">
			<div className="logs-container">{logs}</div>
		</div>
	);
}
