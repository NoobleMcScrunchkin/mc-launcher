import * as React from "react";
const ipcRenderer = window.require("electron").ipcRenderer;

export function GeneralInstanceSettings() {
	const [show, setShow] = React.useState<boolean>(false);

	React.useEffect(() => {
		(async () => {
			setShow(true);
		})();
	}, []);

	if (!show) {
		return;
	}

	return <></>;
}
