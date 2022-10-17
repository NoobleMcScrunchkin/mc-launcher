import * as React from "react";
const ipcRenderer = window.require("electron").ipcRenderer;

export function Popup(props: any) {
	const [display, setDisplay] = React.useState("none");
	const [title, setTitle] = React.useState(props.title);
	const [description, setDescription] = React.useState(props.children);

	const close = () => {
		setDisplay("none");
		document.getElementById("main-content").style.pointerEvents = "auto";
		document.getElementById("main-content").style.opacity = "1";
	};

	React.useEffect(() => {
		if (props.id == "error") {
			ipcRenderer.addListener("ERROR", (event, arg) => {
				setTitle(arg.title);
				setDescription(arg.description);
				setDisplay("block");
				document.getElementById("main-content").style.pointerEvents = "none";
				document.getElementById("main-content").style.opacity = "0.2";
			});

			return () => {
				ipcRenderer.removeAllListeners("ERROR");
			};
		}
	}, []);

	return (
		<>
			<div id={props.id} className="popup" style={{ display }}>
				<div className="popup-head">
					<div className="popup-title">{title}</div>
					<div className="close-btn hover-text" onClick={close}>
						<i className="fa-solid fa-xmark"></i>
					</div>
				</div>
				<div className="popup-desc">{description}</div>
			</div>
		</>
	);
}
