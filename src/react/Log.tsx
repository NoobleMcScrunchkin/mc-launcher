import * as React from "react";

export function Log() {
	let logsEndRef: HTMLElement = null;
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

	const scrollToBottom = () => {
		if (!logsEndRef) {
			return;
		}
		logsEndRef.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
	};

	React.useEffect(() => {
		scrollToBottom();
		window.addEventListener("gamelog", handleGameLog);

		return () => {
			window.removeEventListener("gamelog", handleGameLog);
		};
	}, [logs]);

	return (
		<div id="main-content">
			<div className="logs-container" id="logs-container">
				{logs}
				<div
					ref={(el) => {
						logsEndRef = el;
					}}
				/>
			</div>
		</div>
	);
}
