import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import https from "https";
import { app, BrowserWindow, ipcMain } from "electron";
import { InstanceManager } from "./util/minecraft/game/instanceManager";
import { microsoftLogin } from "./util/minecraft/auth/login";
import { startGame } from "./util/minecraft/game/launcher";

InstanceManager.loadInstances();

const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path.resolve(__dirname, `${app.getAppPath()}/Storage/intermediate.pem`));
const httpsAgent = new https.Agent({ ca: rootCas });
https.globalAgent.options.ca = rootCas;

dotenv.config({
	path: path.resolve(__dirname, `${app.getAppPath()}/Storage/.env`),
});

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
	app.quit();
}

function update_versions(): Promise<void> {
	return new Promise((resolve, reject) => {
		https.get("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", (res) => {
			fs.mkdirSync(`${app.getAppPath()}/Storage/`, { recursive: true });
			const path = `${app.getAppPath()}/Storage/version_manifest_v2.json`;
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

let mainWindow: BrowserWindow | null;

const createWindow = async (): Promise<void> => {
	await update_versions();

	mainWindow = new BrowserWindow({
		height: 600,
		width: 800,
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

	mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.on("GET_INSTANCES", async (event, arg) => {
	let instances = InstanceManager.getInstances();
	console.log(instances);
	event.sender.send("GET_INSTANCES", { instances });
});

ipcMain.on("START_INSTANCE", async (event, arg) => {
	InstanceManager.loadInstances();
	let instance = InstanceManager.getInstance(arg.uuid);
	let user = await microsoftLogin();
	startGame(instance, user, mainWindow);
});
