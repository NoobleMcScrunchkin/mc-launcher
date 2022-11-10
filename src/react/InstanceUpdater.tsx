import * as React from "react";
import { CloseBtn } from "./Components/Buttons/CloseBtn";
import { Btn } from "./Components/Buttons/Btn";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingIcon } from "./Components/Overlays/LoadingIcon";
import { Instance } from "../util/minecraft/game/instance";
const ipcRenderer = window.require("electron").ipcRenderer;

function BackBtn(props: any) {
	return (
		<div className="back-btn hover-text" onClick={props.onClick}>
			<i className="fa-solid fa-angle-left"></i>
		</div>
	);
}

function TypeStep(props: any) {
	React.useEffect(() => {
		props.setType("");
	}, []);

	return (
		<>
			<div className="step-title">
				<div className="title">Select Instance Type</div>
			</div>
			<div className="step">
				<div className="block-radio-container">
					<label htmlFor="vanilla" className="block-radio">
						<input
							type="radio"
							name="type"
							id="vanilla"
							value="vanilla"
							checked={props.type == "vanilla"}
							onChange={(e) => {
								props.setType(e.target.value);
							}}
						/>
						<div
							className="hover-text hover-border"
							onClick={() => {
								props.setStep(props.step + 1);
							}}>
							<div className="icon">
								<i className="fa-solid fa-cube"></i>
							</div>
							<div className="label">Vanilla</div>
						</div>
					</label>
					<label htmlFor="fabric" className="block-radio">
						<input
							type="radio"
							name="type"
							id="fabric"
							value="fabric"
							checked={props.type == "fabric"}
							onChange={(e) => {
								props.setType(e.target.value);
							}}
						/>
						<div
							className="hover-text hover-border"
							onClick={() => {
								props.setStep(props.step + 1);
							}}>
							<div className="icon">
								<i className="fa-solid fa-scroll"></i>
							</div>
							<div className="label">Fabric</div>
						</div>
					</label>
					<label htmlFor="forge" className="block-radio">
						<input
							type="radio"
							name="type"
							id="forge"
							value="forge"
							checked={props.type == "forge"}
							onChange={(e) => {
								props.setType(e.target.value);
							}}
						/>
						<div
							className="hover-text hover-border"
							onClick={() => {
								props.setStep(props.step + 1);
							}}>
							<div className="icon">
								<i className="fa-solid fa-hammer"></i>
							</div>
							<div className="label">Forge</div>
						</div>
					</label>
				</div>
			</div>
		</>
	);
}

function VersionStep(props: any) {
	const [versions, setVersions] = React.useState<Array<any>>([]);
	const [snapshots, setSnapshots] = React.useState<boolean>(false);

	React.useEffect(() => {
		props.setVersion("");

		(async () => {
			setVersions(await ipcRenderer.invoke("GET_VERSIONS", {}));
		})();
	}, []);

	return (
		<>
			<div className="step-title">
				<div className="title">Select Minecraft Version</div>
			</div>
			<div className="step">
				<select
					name="version"
					id="version"
					value={props.version}
					onChange={(e) => {
						props.setVersion(e.target.value);
						if (!e.target.value) return;
						props.setStep(props.step + 1);
					}}>
					<option value="">Select a version...</option>
					{versions
						? versions.map((v: any) => {
								if (v.type == "release" || snapshots) {
									return (
										<option key={v.id} value={v.id}>
											{v.id}
										</option>
									);
								} else {
									return;
								}
						  })
						: null}
				</select>
				<div className="input-group input-group-inline-tight center-content">
					<div className="input-label">Show Snapshots</div>
					<div className="input">
						<label className="switch">
							<input
								type="checkbox"
								checked={snapshots}
								onChange={() => {
									setSnapshots(!snapshots);
								}}
							/>
							<span className="slider round"></span>
						</label>
					</div>
				</div>
			</div>
		</>
	);
}

function ModloaderVersionStep(props: any) {
	const [versions, setVersions] = React.useState<Array<any>>([]);

	React.useEffect(() => {
		props.setModLoaderVersion("");

		(async () => {
			setVersions(await ipcRenderer.invoke("GET_VERSIONS", { modloader: props.type, version: props.version }));
		})();
	}, []);

	return (
		<>
			<div className="step-title">
				<div className="title">Select {props.type[0].toUpperCase() + props.type.slice(1)} Version</div>
			</div>
			<div className="step">
				<select
					name="version"
					id="version"
					value={props.modLoaderVersion}
					onChange={(e) => {
						props.setModLoaderVersion(e.target.value);
						if (!e.target.value) return;
						props.setStep(props.step + 1);
					}}>
					<option value="">Select a version...</option>
					{versions
						? versions.map((v: any) => {
								return (
									<option key={v.id} value={v.id}>
										{v.id}
									</option>
								);
						  })
						: null}
				</select>
			</div>
		</>
	);
}

function ListModpacks(props: any) {
	const [packs, setPacks] = React.useState<Array<any>>([]);
	const [query, setQuery] = React.useState<string>("");
	const [timer, setTimer] = React.useState<NodeJS.Timeout>(null);
	const [scrollTimer, setScrollTimer] = React.useState<NodeJS.Timeout>(null);
	const [pagesLoaded, setPagesLoaded] = React.useState<number>(0);
	const listRef = React.useRef(null);

	const handleQueryInput = (e: React.ChangeEvent) => {
		setQuery((e.target as HTMLInputElement).value);

		clearTimeout(timer);

		const newTimer = setTimeout(async () => {
			setPacks(await ipcRenderer.invoke("GET_MODPACKS", { search: encodeURIComponent((e.target as HTMLInputElement).value) }));
			setPagesLoaded(1);
			listRef.current.scrollTop = 0;
		}, 500);

		setTimer(newTimer);
	};

	const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
		let target = e.target as HTMLDivElement;

		if ((target.scrollTop > target.scrollHeight - 500 || target.scrollHeight - target.scrollTop == target.clientHeight) && !scrollTimer) {
			const newTimer = setTimeout(async () => {
				let newPacks = await ipcRenderer.invoke("GET_MODPACKS", { search: encodeURIComponent(query), page: pagesLoaded });
				if (newPacks.length > 0) {
					setPacks([...packs, ...newPacks]);
					setPagesLoaded(pagesLoaded + 1);
				}
				clearTimeout(scrollTimer);
				setScrollTimer(null);
			}, 100);

			setScrollTimer(newTimer);
		}
	};

	React.useEffect(() => {
		props.setProject("");
		props.setFile("");

		(async () => {
			setPacks(await ipcRenderer.invoke("GET_MODPACKS", { search: query }));
			setPagesLoaded(1);
		})();
	}, []);

	return (
		<div className="modpacks-container-list">
			<div className="title">CurseForge Modpacks</div>
			<div className="actions">
				<div className="search hover-border">
					<div className="icon">
						<i className="fa-solid fa-magnifying-glass"></i>
					</div>
					<input type="text" value={query} onChange={handleQueryInput} />
				</div>
			</div>
			<div className="modpack-list" onScroll={handleScroll} ref={listRef}>
				{packs.map((p, i) => {
					return (
						<div key={i} className="modpack-listing">
							<div className="modpack-icon">
								<img src={p.logo.thumbnailUrl} />
							</div>
							<div className="modpack-info">
								<div className="modpack-title">{p.name}</div>
								<div className="modpack-summary">{p.summary}</div>
							</div>
							<div className="modpack-actions">
								<Btn
									style={{ marginRight: "0.5rem" }}
									onClick={() => {
										props.setProject(p.id);
										let files = p.latestFiles.sort((a: any, b: any) => {
											return new Date(b.fileDate).valueOf() - new Date(a.fileDate).valueOf();
										});
										props.setFile(files[0].id);
										props.setStep(3);
									}}>
									Download Latest
								</Btn>
								<Btn
									onClick={() => {
										props.setProject(p.id);
										props.setProjectObj(p);
										props.setStep(2);
									}}>
									Details
								</Btn>
							</div>
						</div>
					);
				})}
				{packs.length ? (
					<div className="modpack-listing loading">
						<LoadingIcon />
					</div>
				) : null}
			</div>
		</div>
	);
}

function ModpackDetails(props: any) {
	const [summary, setSummary] = React.useState<string>("");
	const [files, setFiles] = React.useState<Array<any>>([]);

	React.useEffect(() => {
		(async () => {
			setSummary(await ipcRenderer.invoke("GET_MODPACK_SUMMARY", { project: props.project }));
			setFiles(
				(await ipcRenderer.invoke("GET_MODPACK_VERSIONS", { project: props.project })).sort((a: any, b: any) => {
					return new Date(b.fileDate).valueOf() - new Date(a.fileDate).valueOf();
				})
			);
		})();
	}, []);

	return (
		<div className="modpack-details-container">
			<div className="modpack-iframe" dangerouslySetInnerHTML={{ __html: summary.replaceAll(/<\/?a[^>]*>/g, "") }}></div>
			<div className="actions">
				<select
					name="file"
					id="file"
					value={props.file}
					onChange={(e) => {
						props.setFile(e.target.value);
					}}>
					<option value="">Select a version...</option>
					{files.map((f: any) => {
						return (
							<option key={f.id} value={f.id}>
								{f.displayName.replace(".zip", "")}
							</option>
						);
					})}
				</select>
				<Btn
					onClick={() => {
						if (!props.file) return;
						props.setStep(props.step + 1);
					}}>
					Install
				</Btn>
			</div>
		</div>
	);
}

function Finalize(props: any) {
	return (
		<>
			<div className="step-title">
				<div className="title">Ready to update?</div>
			</div>
			<div className="step">
				<div className="input-group">
					<Btn onClick={props.updateInstance}>Update</Btn>
				</div>
			</div>
		</>
	);
}

export function InstanceUpdater() {
	const navigate = useNavigate();

	const { uuid } = useParams<{ uuid: string }>();

	const [instance, setInstance] = React.useState<Instance>(null);
	const [step, setStep] = React.useState<number>(0);
	const [type, setType] = React.useState<string>("");
	const [version, setVersion] = React.useState<string>("");
	const [project, setProject] = React.useState<string>("");
	const [projectObj, setProjectObj] = React.useState<any>({});
	const [file, setFile] = React.useState<string>("");
	const [modLoaderVersion, setModLoaderVersion] = React.useState<string>("");
	const [existingModpack, setExistingModpack] = React.useState<boolean>(false);

	const updateInstance = () => {
		if (type == "modpack") {
			ipcRenderer.send("UPDATE_INSTANCE_MODPACK", { uuid: instance.uuid, project, file });
		} else {
			ipcRenderer.send("UPDATE_INSTANCE", { uuid: instance.uuid, type, version, modLoaderVersion });
		}
		navigate("/");
	};

	const steps = [
		// <ListModpacks step={step} setStep={setStep} setProject={setProject} setFile={setFile} />,
		<TypeStep step={step} setStep={setStep} type={type} setType={setType} />,
		<VersionStep step={step} setStep={setStep} version={version} setVersion={setVersion} />,
		<Finalize step={step} setStep={setStep} updateInstance={updateInstance} />,
	];
	const modded_steps = [
		<TypeStep step={step} setStep={setStep} type={type} setType={setType} />,
		<VersionStep step={step} setStep={setStep} version={version} setVersion={setVersion} />,
		<ModloaderVersionStep step={step} setStep={setStep} modLoaderVersion={modLoaderVersion} setModLoaderVersion={setModLoaderVersion} version={version} type={type} />,
		<Finalize step={step} setStep={setStep} updateInstance={updateInstance} />,
	];
	const modpack_steps = [<ModpackDetails step={step} setStep={setStep} project={project} projectObj={projectObj} setFile={setFile} file={file} />, <Finalize step={step} setStep={setStep} updateInstance={updateInstance} />];

	const setRPC = () => {
		ipcRenderer.send("SET_RPC", {
			details: "Creating an instance",
			state: "Choosing options",
			largeImageKey: "rainbow_clouds",
			largeImageText: "Custom Launcher",
			smallImageKey: "rainbow_clouds",
			smallImageText: "Getting ready to play some Minecraft",
		});
	};

	React.useEffect(() => {
		setRPC();

		if (uuid) {
			(async () => {
				let ex_instance = await ipcRenderer.invoke("GET_INSTANCE", { uuid });
				setInstance(ex_instance);
				setExistingModpack(ex_instance.modpack);
				setType(ex_instance.modpack ? "modpack" : "");
				setProject(ex_instance.modpack_info?.project);
			})();
		}

		ipcRenderer.addListener("SET_RPC", (event, arg) => {
			setRPC();
		});

		return () => {
			ipcRenderer.removeAllListeners("SET_RPC");
		};
	}, []);

	return (
		<div id="main-content" className="no-bg">
			<CloseBtn />
			{step != 0 ? <BackBtn onClick={() => (type == "modpack" && step == 3 ? setStep(1) : setStep(step - 1))} /> : null}
			<TransitionGroup component={null}>
				<CSSTransition key={step} classNames="fade" timeout={200}>
					<div className="instance-creator">{existingModpack ? modpack_steps[step] : type == "vanilla" || type == "" ? steps[step] : modded_steps[step]}</div>
				</CSSTransition>
			</TransitionGroup>
		</div>
	);
}
