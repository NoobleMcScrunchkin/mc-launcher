import * as React from "react";
import * as ReactDOM from "react-dom";
import { Instance } from "../../util/minecraft/game/instance";
import { ContextMenu } from "../Components/ContextMenu/ContextMenu";
import { ContextMenuNavItem } from "../Components/ContextMenu/ContextMenuNavItem";
import { LoadingIcon } from "../Components/Overlays/LoadingIcon";
import { PlayIconOverlay } from "../Components/Overlays/PlayIconOverlay";
import LinesEllipsis from "react-lines-ellipsis";
import responsiveHOC from "react-lines-ellipsis/lib/responsiveHOC";
const ResponsiveEllipsis = responsiveHOC()(LinesEllipsis);
const { ipcRenderer } = window.require("electron");

export function InstanceIcon(props: any) {
	const nodeRef = React.useRef();
	const [loading, setLoading] = React.useState<string>("");
	const [forceUpdate, setForceUpdate] = React.useState<number>(0);

	let instance: Instance = props.instance;

	const startGame = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.button == 0) {
			if (loading == "" && !(ReactDOM.findDOMNode(nodeRef.current) as HTMLElement).classList.contains("no-hover")) {
				ipcRenderer.send("START_INSTANCE", { uuid: instance.uuid });
				setLoading("loading");
			}
		}
	};

	React.useEffect(() => {
		ipcRenderer.setMaxListeners(999);

		ipcRenderer.on("INSTANCE_STARTED", (event, args) => {
			if (args.uuid == instance.uuid) {
				setLoading("");
			}
		});

		ipcRenderer.on("INSTANCE_START_ERROR", (event, args) => {
			if (args.uuid == instance.uuid) {
				setLoading("");
			}
		});

		return () => {
			ipcRenderer.removeAllListeners("INSTANCE_STARTED");
			ipcRenderer.removeAllListeners("INSTANCE_START_ERROR");
		};
	}, []);

	return (
		<>
			<div className={`instance-icon ${loading}`}>
				<div ref={nodeRef} className={`instance-container hover-border loading-dim hover-text-dim hover-text-blur`} onMouseDown={startGame}>
					<div className="instance-name">
						<ResponsiveEllipsis text={instance.name} maxLine="2" ellipsis="..." trimRight basedOn="letters" />
					</div>
					<PlayIconOverlay />
					<ContextMenu title={instance.name}>
						<ContextMenuNavItem to={"#"} icon={<i className="fa-solid fa-pencil"></i>}>
							Edit Instance
						</ContextMenuNavItem>
						<ContextMenuNavItem icon={<i className="fa-solid fa-screwdriver-wrench"></i>}>Manage Mods</ContextMenuNavItem>
						<ContextMenuNavItem icon={<i className="fa-solid fa-folder"></i>}>Open Folder</ContextMenuNavItem>
						<ContextMenuNavItem icon={<i className="fa-solid fa-trash"></i>} className="hover-text-red">
							Delete Instance
						</ContextMenuNavItem>
					</ContextMenu>
				</div>
				<LoadingIcon />
			</div>
		</>
	);
}
