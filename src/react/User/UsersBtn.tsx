import * as React from "react";
import { Btn } from "../Components/Btn";
import { User } from "../../util/minecraft/auth/user";
import { Link } from "react-router-dom";
const { ipcRenderer } = window.require("electron");

export function UsersBtn(props: any) {
	const [currentUser, setCurrentUser] = React.useState<User>(null);

	const login = () => {
		ipcRenderer.send("LOGIN", {});
	};

	React.useEffect(() => {
		ipcRenderer.send("GET_USER", {});

		ipcRenderer.addListener("GET_USER", (event, arg) => {
			setCurrentUser(arg.user);
		});

		return () => {
			ipcRenderer.removeAllListeners("GET_USER");
		};
	}, []);

	return (
		<>
			<Link to={"/users"}>
				<Btn className="login-btn">{currentUser ? currentUser.name : "Login"}</Btn>
			</Link>
		</>
	);
}
