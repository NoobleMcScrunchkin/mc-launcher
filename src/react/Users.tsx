import * as React from "react";
import { CloseBtn } from "./Components/CloseBtn";
import { Header } from "./Components/Header";
import { Footer } from "./Components/Footer";
import { LoadingIcon } from "./Components/LoadingIcon";
import { UsersList } from "./User/UsersList";
import { AddUserBtn } from "./User/AddUserBtn";

export function Users() {
	const [mainLoading, setMainLoading] = React.useState("");

	return (
		<div id="main-content" className={mainLoading}>
			<Header className="loading-dim">
				<div className="info">
					<div className="header-title">Users</div>
				</div>
				<CloseBtn />
			</Header>
			<UsersList className="loading-dim" style={{ flexGrow: 1 }} loading={setMainLoading} />
			<Footer className="loading-dim">
				<div className="info"></div>
				<div className="buttons">
					<AddUserBtn loading={setMainLoading} />
				</div>
			</Footer>
			<LoadingIcon />
		</div>
	);
}
