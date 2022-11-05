import * as React from "react";
import { CloseBtn } from "./Components/Buttons/CloseBtn";
import { Btn } from "./Components/Buttons/Btn";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { useNavigate } from "react-router-dom";
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
					<label htmlFor="modpack" className="block-radio">
						<input
							type="radio"
							name="type"
							id="modpack"
							value="modpack"
							checked={props.type == "modpack"}
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
								<i className="fa-solid fa-screwdriver-wrench"></i>
							</div>
							<div className="label">Modpack</div>
						</div>
					</label>
				</div>
			</div>
		</>
	);
}

function VersionStep(props: any) {
	const [versions, setVersions] = React.useState<Array<any>>([]);

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

function NameStep(props: any) {
	return (
		<>
			<div className="step-title">
				<div className="title">Name your Instance</div>
			</div>
			<div className="step">
				<div className="input-group">
					<input type="text" name="name" id="name" value={props.name} onChange={(e) => props.setName(e.target.value)} />
				</div>
				<div className="input-group">
					<Btn onClick={props.createInstance}>Create</Btn>
				</div>
			</div>
		</>
	);
}

export function InstanceCreator() {
	const navigate = useNavigate();

	const [step, setStep] = React.useState<number>(0);
	const [type, setType] = React.useState<string>("");
	const [version, setVersion] = React.useState<string>("");
	const [name, setName] = React.useState<string>("");
	const [modLoaderVersion, setModLoaderVersion] = React.useState<string>("");

	const createInstance = () => {
		ipcRenderer.send("CREATE_INSTANCE", { name, type, version, modLoaderVersion });
		navigate("/");
	};

	const steps = [<TypeStep step={step} setStep={setStep} type={type} setType={setType} />, <VersionStep step={step} setStep={setStep} version={version} setVersion={setVersion} />, <NameStep step={step} setStep={setStep} name={name} setName={setName} createInstance={createInstance} />];
	const modded_steps = [
		<TypeStep step={step} setStep={setStep} type={type} setType={setType} />,
		<VersionStep step={step} setStep={setStep} version={version} setVersion={setVersion} />,
		<ModloaderVersionStep step={step} setStep={setStep} modLoaderVersion={modLoaderVersion} setModLoaderVersion={setModLoaderVersion} version={version} type={type} />,
		<NameStep step={step} setStep={setStep} name={name} setName={setName} createInstance={createInstance} />,
	];
	const modpack_steps = [<TypeStep step={step} setStep={setStep} type={type} setType={setType} />, <VersionStep step={step} setStep={setStep} version={version} setVersion={setVersion} />, <NameStep step={step} setStep={setStep} name={name} setName={setName} createInstance={createInstance} />];

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
			{step != 0 ? <BackBtn onClick={() => setStep(step - 1)} /> : null}
			<TransitionGroup component={null}>
				<CSSTransition key={step} classNames="fade" timeout={200}>
					<div className="instance-creator">{type == "modpack" ? modpack_steps[step] : type == "vanilla" ? steps[step] : modded_steps[step]}</div>
				</CSSTransition>
			</TransitionGroup>
		</div>
	);
}
