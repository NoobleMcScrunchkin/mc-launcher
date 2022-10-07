import * as React from "react";
import { CloseBtn } from "./Components/CloseBtn";
import { Header } from "./Components/Header";
import { Footer } from "./Components/Footer";
import { UsersList } from "./User/UsersList";
import { AddUserBtn } from "./User/AddUserBtn";

export function Users() {
	return (
		<div id="main-content">
			<Header>
				<div className="info">
					<div className="header-title">Users</div>
				</div>
				<CloseBtn />
			</Header>
			<UsersList style={{ flexGrow: 1 }} />
			<Footer>
				<div className="info"></div>
				<div className="buttons">
					<AddUserBtn />
				</div>
			</Footer>
		</div>
	);
}
