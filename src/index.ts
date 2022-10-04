import fs from "fs";
import path from "path";
import https from "https";
import { app, BrowserWindow, ipcMain } from "electron";
import { InstanceManager } from "./util/minecraft/game/instanceManager";
import { microsoftLogin } from "./util/minecraft/auth/login";
import { startGame } from "./util/minecraft/game/launcher";

InstanceManager.loadInstances();

const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path.resolve(__dirname, `${process.resourcesPath}/intermediate.pem`));
const httpsAgent = new https.Agent({ ca: rootCas });
https.globalAgent.options.ca = rootCas;

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
	app.quit();
}

let mainWindow: BrowserWindow | null;

async function createWindow(): Promise<void> {
	await InstanceManager.update_versions();

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
}

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

ipcMain.on("CREATE_INSTANCE", async (event, arg) => {
	let instance = InstanceManager.createInstance(arg.name, arg.type, arg.version);
	let instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances });
});

ipcMain.on("GET_INSTANCES", async (event, arg) => {
	let instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances });
});

ipcMain.on("START_INSTANCE", async (event, arg) => {
	InstanceManager.loadInstances();
	let instance = InstanceManager.getInstance(arg.uuid);
	let user = await microsoftLogin();
	startGame(instance, user, mainWindow);
});
