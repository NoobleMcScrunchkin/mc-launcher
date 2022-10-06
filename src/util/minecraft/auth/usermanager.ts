import { User } from "./user";
import { microsoftLogin } from "./login";

export class UserManager {
	static currentUser: User = null;

	static async login() {
		this.currentUser = await microsoftLogin();
		return this.currentUser;
	}
}
