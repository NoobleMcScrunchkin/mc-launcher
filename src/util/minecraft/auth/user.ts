import fetch from "node-fetch";
import { token_update } from "./login";
import http from "http";
import { mkdirSync, createWriteStream, readFileSync } from "fs";
import { Storage } from "../../storage";
import Jimp from "jimp";

export class User {
	ms_token: any = {};
	mc_token: any = {};
	name: string = "";
	uuid: string = "";
	skins: Array<any> = [];
	capes: Array<any> = [];
	headImage: string = "";

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

		await this.download_skin();
	}

	async download_skin() {
		console.log("Downloading Skin");
		http.get(this.skins[0].url, (res) => {
			mkdirSync(Storage.resourcesPath + "/Storage/skins", { recursive: true });
			const dlpath = Storage.resourcesPath + "/Storage/skins" + "/" + this.skins[0].id + ".png";
			const filePath = createWriteStream(dlpath);
			res.pipe(filePath);
			filePath.on("finish", async () => {
				filePath.close();
				console.log("Download Completed");

				mkdirSync(Storage.resourcesPath + "/Storage/skins/heads", { recursive: true });

				(await Jimp.read(Storage.resourcesPath + "/Storage/skins" + "/" + this.skins[0].id + ".png")).crop(8, 8, 8, 8).write(Storage.resourcesPath + "/Storage/skins" + "/heads/" + this.skins[0].id + "-base.png");
				(await Jimp.read(Storage.resourcesPath + "/Storage/skins" + "/" + this.skins[0].id + ".png")).crop(40, 8, 8, 8).write(Storage.resourcesPath + "/Storage/skins" + "/heads/" + this.skins[0].id + "-top.png");

				this.headImage = await (
					await Jimp.read(Storage.resourcesPath + "/Storage/skins" + "/heads/" + this.skins[0].id + "-base.png")
				)
					.composite(await Jimp.read(Storage.resourcesPath + "/Storage/skins" + "/heads/" + this.skins[0].id + "-top.png"), 0, 0)
					.write(Storage.resourcesPath + "/Storage/skins" + "/heads/" + this.skins[0].id + ".png")
					.getBase64Async("image/png");
			});
		});
	}

	async update_tokens() {
		const { ms_token, mc_token } = await token_update(this.ms_token.refresh_token);
		this.ms_token = ms_token;
		this.mc_token = mc_token;
	}

	static async create(ms_token: any, mc_token: string): Promise<User> {
		let user = new User(ms_token, mc_token);
		await user.get_user_info();
		return user;
	}
}
