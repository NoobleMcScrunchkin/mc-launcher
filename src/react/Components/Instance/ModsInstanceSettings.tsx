import * as React from "react";
import { useInstance } from "../../InstanceSettings";
import { Btn } from "../Buttons/Btn";
import { Link } from "react-router-dom";
const ipcRenderer = window.require("electron").ipcRenderer;

export function ModsInstanceSettings() {
	const { instance, setInstance } = useInstance();
	const [show, setShow] = React.useState<boolean>(false);
	const [mods, setMods] = React.useState<string[]>([]);
	const [query, setQuery] = React.useState<string>("");

	const toggleMod = async (mod: string) => {
		setMods(await ipcRenderer.invoke("TOGGLE_MOD", { uuid: instance.uuid, mod }));
	};

	React.useEffect(() => {
		(async () => {
			if (instance) {
				setMods(await ipcRenderer.invoke("GET_INSTANCE_MODS", { uuid: instance.uuid }));
				setShow(true);
			}
		})();
	}, [instance]);

	if (!show) {
		return;
	}

	return (
		<>
			<div className="mods-container">
				<div className="actions">
					<div className="search hover-border">
						<div className="icon">
							<i className="fa-solid fa-magnifying-glass"></i>
						</div>
						<input
							type="text"
							value={query}
							onChange={(e) => {
								setQuery((e.target as HTMLInputElement).value);
							}}
						/>
					</div>
					{/* <Link to={`/`}>
						<Btn style={{ fontSize: "1rem", padding: "0.25rem", height: "2.5rem" }}>Add Mod</Btn>
					</Link> */}
				</div>
				<div className="mods-list">
					{mods.map((mod) => {
						if ((mod.endsWith(".jar") || mod.endsWith(".disabled")) && mod.toLowerCase().includes(query.toLowerCase())) {
							return (
								<div key={mod.replace(".jar", "").replace(".disabled", "")} className="mod">
									<div className="input-group input-group-inline">
										<div className="input-label">{mod.replace(".jar", "").replace(".disabled", "")}</div>
										<div className="input">
											<label className="switch" style={{ "--scale": "0.6" } as React.StyleHTMLAttributes<string>}>
												<input
													type="checkbox"
													checked={mod.endsWith(".jar")}
													onChange={() => {
														toggleMod(mod);
													}}
												/>
												<span className="slider round"></span>
											</label>
										</div>
									</div>
								</div>
							);
						}
					})}
				</div>
			</div>
		</>
	);
}
