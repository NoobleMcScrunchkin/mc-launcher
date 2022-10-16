import { User } from "./user";
import { microsoftLogin } from "./login";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { Storage } from "../../storage";

export class UserManager {
	static currentUser: User = null;
	static users: Array<User> = [];
	static storage_path: string = Storage.resourcesPath + "/Storage/";
	static json_path: string = UserManager.storage_path + "/users.json";
	static json_current_path: string = UserManager.storage_path + "/current_user.json";

	static loadUsers(): void {
		if (existsSync(UserManager.json_path)) {
			let json = JSON.parse(readFileSync(UserManager.json_path).toString());
			json.forEach((user: any) => {
				let userObj = Object.setPrototypeOf(user, User.prototype);
				UserManager.users.push(userObj);

				userObj.download_skin();
			});
		}

		if (existsSync(UserManager.json_current_path)) {
			let json = JSON.parse(readFileSync(UserManager.json_current_path).toString());
			if (json.uuid) {
				UserManager.currentUser = UserManager.get_user(json.uuid);
			}
		}

		UserManager.saveUsers();
	}

	static saveUsers(): void {
		let json = JSON.stringify(UserManager.users);
		mkdirSync(UserManager.storage_path, { recursive: true });
		writeFileSync(UserManager.json_path, json);

		if (UserManager.currentUser) {
			json = JSON.stringify({
				uuid: UserManager.currentUser.uuid,
			});
			mkdirSync(UserManager.storage_path, { recursive: true });
			writeFileSync(UserManager.json_current_path, json);
		}
	}

	static async login(): Promise<User> {
		let user: User = await microsoftLogin();
		let existingUser = UserManager.users.findIndex((u) => {
			return u.uuid == user.uuid;
		});

		if (existingUser != -1) {
			UserManager.users[existingUser] = user;
		} else {
			UserManager.users.push(user);
		}

		UserManager.currentUser = user;
		UserManager.saveUsers();

		return UserManager.currentUser;
	}

	static get_user(uuid: string): User {
		let user = UserManager.users.find((u) => {
			return u.uuid == uuid;
		});
		return user;
	}

	static delete_user(uuid: string) {
		let existingUser = UserManager.users.findIndex((u) => {
			return u.uuid == uuid;
		});

		if (existingUser == -1) {
			return;
		}

		UserManager.users.splice(existingUser, 1);

		if (UserManager.currentUser && UserManager.currentUser.uuid == uuid) {
			if (UserManager.users.length > 0) {
				UserManager.currentUser = UserManager.users[0];
			} else {
				UserManager.currentUser = null;
			}
		}

		UserManager.saveUsers();
	}

	static set_current_user(uuid: string) {
		let user = UserManager.get_user(uuid);

		if (user) {
			UserManager.currentUser = user;
		}

		UserManager.saveUsers();
	}
}
