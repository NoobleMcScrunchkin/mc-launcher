import { app, BrowserWindow, session } from "electron";
import path from "path";
import "./ipcEvents";

declare const DASHBOARD_WEBPACK_ENTRY: string;
declare const DASHBOARD_PRELOAD_WEBPACK_ENTRY: string;

export class Browser {
	static mainWindow: BrowserWindow | null = null;

	static createWindow(): void {
		Browser.mainWindow = new BrowserWindow({
			height: 600,
			width: 800,
			webPreferences: {
				preload: DASHBOARD_PRELOAD_WEBPACK_ENTRY,
				nodeIntegration: true,
				contextIsolation: false,
			},
			frame: false,
			icon: path.resolve(process.resourcesPath + "/app.ico"),
		});

		Browser.mainWindow.loadURL(DASHBOARD_WEBPACK_ENTRY);

		Browser.mainWindow.on("closed", () => {
			Browser.mainWindow = null;
		});
	}

	static init(): void {
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
