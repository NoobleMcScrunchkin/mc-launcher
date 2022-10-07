import * as React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../../util/minecraft/auth/user";
const { ipcRenderer } = window.require("electron");

export function UsersList(props: any) {
	const navigate = useNavigate();
	const [users, setUsers] = React.useState<Array<User>>(null);

	const setCurrentUser = (uuid: string) => {
		ipcRenderer.send("SET_CURRENT_USER", { uuid });
	};

	const deleteUser = (uuid: string) => {
		ipcRenderer.send("DELETE_USER", { uuid });
	};

	React.useEffect(() => {
		ipcRenderer.send("GET_USERS", {});

		ipcRenderer.addListener("GET_USERS", (event, arg) => {
			setUsers(arg.users);
		});

		ipcRenderer.addListener("SET_CURRENT_USER", (event, arg) => {
			navigate("/");
		});

		return () => {
			ipcRenderer.removeAllListeners("GET_USERS");
			ipcRenderer.removeAllListeners("SET_CURRENT_USER");
		};
	}, []);

	return (
		<>
			<div style={props.style} className="users-list">
				{users != null &&
					users.length > 0 &&
					users.map((user: User) => {
						if (user != null) {
							return (
								<div key={user.uuid} className="user-item">
									<div
										className="user-name"
										onClick={() => {
											setCurrentUser(user.uuid);
										}}>
										{user.name}
									</div>
									<div className="user-buttons">
										<div
											className="user-delete hover-text"
											onClick={() => {
												deleteUser(user.uuid);
											}}>
											X
										</div>
									</div>
								</div>
							);
						}
					})}
			</div>
		</>
	);
}
