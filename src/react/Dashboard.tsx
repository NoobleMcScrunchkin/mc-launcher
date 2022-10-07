import * as React from "react";
import { InstanceGrid } from "./Instance/InstanceGrid";
import { Header } from "./Components/Header";
import { Footer } from "./Components/Footer";
import { AddInstanceBtn } from "./Instance/AddInstanceBtn";
import { UsersBtn } from "./User/UsersBtn";

export function Dashboard() {
	return (
		<div id="main-content">
			<Header>
				<div className="info">
					<div className="header-title">MC Launcher</div>
				</div>
				<div className="buttons">
					<UsersBtn />
				</div>
			</Header>
			<InstanceGrid style={{ flexGrow: 1 }} />
			<Footer>
				<div className="info"></div>
				<div className="buttons">
					<AddInstanceBtn />
				</div>
			</Footer>
		</div>
	);
}
