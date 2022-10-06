import { app, BrowserWindow, session } from "electron";
import "./ipcEvents";

declare const DASHBOARD_WEBPACK_ENTRY: string;
declare const DASHBOARD_PRELOAD_WEBPACK_ENTRY: string;

export class Browser {
	static mainWindow: BrowserWindow | null = null;

	static createWindow() {
		session.defaultSession.loadExtension("C:\\Users\\kiera\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi\\4.25.0_0");

		Browser.mainWindow = new BrowserWindow({
			height: 600,
			width: 800,
			webPreferences: {
				preload: DASHBOARD_PRELOAD_WEBPACK_ENTRY,
				nodeIntegration: true,
				contextIsolation: false,
			},
		});

		Browser.mainWindow.loadURL(DASHBOARD_WEBPACK_ENTRY);

		Browser.mainWindow.on("closed", () => {
			Browser.mainWindow = null;
		});
	}

	static init() {
		if (require("electron-squirrel-startup")) {
			app.quit();
		}

		app.on("ready", Browser.createWindow);

		app.on("window-all-closed", () => {
			if (process.platform !== "darwin") {
				app.quit();
			}
		});

		app.on("activate", () => {
			if (Browser.mainWindow === null) {
				Browser.createWindow();
			}
		});
	}
}