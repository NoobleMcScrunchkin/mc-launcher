import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Routes, Route, HashRouter } from "react-router-dom";
import { Root } from "./react/Root";
import { Dashboard } from "./react/Dashboard";
import { InstanceCreator } from "./react/InstanceCreator";
import { Users } from "./react/Users";

import "./css/main.css";

const root = ReactDOM.createRoot(document.getElementById("react-root"));
root.render(
	<React.StrictMode>
		<HashRouter>
			<Routes>
				<Route path="/" element={<Root />}>
					<Route path="" element={<Dashboard />}></Route>
					<Route path="instanceCreator" element={<InstanceCreator />}></Route>
					<Route path="users" element={<Users />}></Route>
				</Route>
			</Routes>
		</HashRouter>
	</React.StrictMode>
);
