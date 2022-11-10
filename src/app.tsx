import React from "react";
import ReactDOM from "react-dom/client";
import { Routes, Route, HashRouter, useLocation } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { Root } from "./react/Root";
import { Dashboard } from "./react/Dashboard";
import { InstanceCreator } from "./react/InstanceCreator";
import { InstanceUpdater } from "./react/InstanceUpdater";
import { Users } from "./react/Users";
import { Log } from "./react/Log";
import { RootNoFrame } from "./react/RootNoFrame";
import { Settings } from "./react/Settings";
import { InstanceSettings } from "./react/InstanceSettings";
import { GeneralSettings } from "./react/Components/Settings/GeneralSettings";
import { GeneralInstanceSettings } from "./react/Components/Instance/GeneralInstanceSettings";
import { ModsInstanceSettings } from "./react/Components/Instance/ModsInstanceSettings";
import { JavaInstanceSettings } from "./react/Components/Instance/JavaInstanceSettings";

import "./css/main.css";
import "./fontawesome/css/all.css";

function App() {
	const location = useLocation();

	if (location.pathname == "/log") {
		return (
			<RootNoFrame>
				<Log />
			</RootNoFrame>
		);
	}

	return (
		<Root>
			<TransitionGroup component={null}>
				<CSSTransition key={location.key} classNames="fade" timeout={200}>
					<Routes location={location}>
						<Route path="/" element={<Dashboard />}></Route>
						<Route path="/instanceCreator" element={<InstanceCreator />}></Route>
						<Route path="/instanceUpdater/:uuid" element={<InstanceUpdater />}></Route>
						<Route path="/users" element={<Users />}></Route>
						<Route path="/settings" element={<Settings />}>
							<Route path="general" element={<GeneralSettings />}></Route>
						</Route>
						<Route path="/instanceSettings/:uuid" element={<InstanceSettings />}>
							<Route path="general" element={<GeneralInstanceSettings />}></Route>
							<Route path="java" element={<JavaInstanceSettings />}></Route>
							<Route path="mods" element={<ModsInstanceSettings />}></Route>
						</Route>
						<Route path="/instanceSettings/:uuid" element={<InstanceSettings />}>
							<Route path="general" element={<GeneralInstanceSettings />}></Route>
							<Route path="java" element={<JavaInstanceSettings />}></Route>
						</Route>
					</Routes>
				</CSSTransition>
			</TransitionGroup>
		</Root>
	);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<HashRouter>
		<App />
	</HashRouter>
);
