import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Routes, Route, HashRouter } from "react-router-dom";
import { Root } from "./react/Root";
import { Dashboard } from "./react/Dashboard";
import { InstanceCreator } from "./react/InstanceCreator";
import { Users } from "./react/Users";
import { Log } from "./react/Log";
import { RootNoFrame } from "./react/RootNoFrame";
import { Settings } from "./react/Settings";
import { GeneralSettings } from "./react/Components/Settings/GeneralSettings";

import "./css/main.css";
import "./fontawesome/css/all.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<HashRouter>
			<Routes>
				<Route path="/" element={<Root />}>
					<Route path="" element={<Dashboard />}></Route>
					<Route path="instanceCreator" element={<InstanceCreator />}></Route>
					<Route path="users" element={<Users />}></Route>
					<Route path="settings" element={<Settings />}>
						<Route path="general" element={<GeneralSettings />}></Route>
					</Route>
				</Route>
				<Route path="/" element={<RootNoFrame />}>
					<Route path="log" element={<Log />}></Route>
				</Route>
			</Routes>
		</HashRouter>
	</React.StrictMode>
);
