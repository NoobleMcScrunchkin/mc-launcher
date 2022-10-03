import fetch from "node-fetch";

export class User {
	ms_token: any = {};
	mc_token: any = {};
	name: string = "";
	uuid: string = "";
	skins: Array<any> = [];
	capes: Array<any> = [];

	constructor(ms_token: any, mc_token: string) {
		this.ms_token = ms_token;
		this.mc_token = mc_token;
	}

	async get_user_info(): Promise<any> {
		let res = await fetch("https://api.minecraftservices.com/minecraft/profile", {
			method: "GET",
			headers: {
				Authorization: "Bearer " + this.mc_token.access_token,
			},
		});
		let json = await res.json();
		this.name = json.name;
		this.uuid = json.id;
		this.skins = json.skins;
		this.capes = json.capes;
	}

	static async create(ms_token: any, mc_token: string): Promise<User> {
		let user = new User(ms_token, mc_token);
		await user.get_user_info();
		return user;
	}
}
