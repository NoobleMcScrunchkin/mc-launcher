import dotenv from "dotenv";
import electron from "electron";
import { login, microsoftLogin } from "./util/minecraft/auth/login";
import { User } from "./util/minecraft/auth/user";
import { startGame } from "./util/minecraft/game/launcher";
import { app } from "electron";
import fs from "fs";
import path from "path";
import https from "https";
import { Instance } from "./util/minecraft/game/instance";

const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path.resolve(__dirname, "../intermediate.pem"));
const httpsAgent = new https.Agent({ ca: rootCas });
https.globalAgent.options.ca = rootCas;

dotenv.config();

async function update_versions(): Promise<void> {
	return new Promise((resolve, reject) => {
		https.get("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", (res) => {
			const path = `${__dirname}/../Storage/version_manifest_v2.json`;
			const filePath = fs.createWriteStream(path);
			res.pipe(filePath);
			filePath.on("finish", () => {
				filePath.close();
				console.log("Download Completed");
				resolve();
			});
		});
	});
}

async function main() {
	// await update_versions();

	const win = new electron.BrowserWindow({
		width: 800,
		height: 600,
	});

	let user = await microsoftLogin();

	let instance = await Instance.create("vanilla", "1.19.2", `${__dirname}/../Storage/mc`);

	startGame(instance, user);
}

app.on("ready", () => {
	main();
});
