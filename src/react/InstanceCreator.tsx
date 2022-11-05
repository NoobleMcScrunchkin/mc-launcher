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

function StepOne(props: any) {
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

function StepTwo(props: any) {
	const [versions, setVersions] = React.useState<any>({});

	React.useEffect(() => {
		(async () => {
			setVersions(await ipcRenderer.invoke("GET_VERSIONS"));
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
					{versions.versions
						? versions.versions.map((v: any) => {
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

export function InstanceCreator() {
	const navigate = useNavigate();

	const [step, setStep] = React.useState<number>(0);

	const [type, setType] = React.useState<string>("");
	const [version, setVersion] = React.useState<string>("");
	const [name, setName] = React.useState<string>("");
	const [modLoaderVersion, setModLoaderVersion] = React.useState<string>("");
	const steps = [<StepOne step={step} setStep={setStep} type={type} setType={setType} />, <StepTwo step={step} setStep={setStep} version={version} setVersion={setVersion} />];

	const createInstance = () => {
		ipcRenderer.send("CREATE_INSTANCE", { name, type, version, modLoaderVersion });
		navigate("/");
	};

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
					<div className="instance-creator">{steps[step]}</div>
				</CSSTransition>
			</TransitionGroup>
		</div>
	);
}
