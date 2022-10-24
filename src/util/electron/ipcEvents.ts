import { ipcMain, BrowserWindow } from "electron";
import { UserManager } from "../minecraft/auth/userManager";
import { InstanceManager } from "../minecraft/game/instanceManager";
import { startGame } from "../minecraft/game/launcher";
import { Browser } from "./browser";
import { DiscordRPC } from "../discord/rpc";
import { Settings } from "../settings";

declare const DASHBOARD_WEBPACK_ENTRY: string;

ipcMain.on("MINIMIZE", (event, arg): void => {
	Browser.mainWindow?.minimize();
});

ipcMain.on("MAXIMIZE", (event, arg): void => {
	if (Browser.mainWindow?.isMaximized()) {
		Browser.mainWindow?.unmaximize();
	} else {
		Browser.mainWindow?.maximize();
	}
});

ipcMain.on("CLOSE", (event, arg): void => {
	Browser.mainWindow?.close();
});

ipcMain.on("CREATE_INSTANCE", async (event, arg): Promise<void> => {
	let instance = await InstanceManager.createInstance(arg.name, arg.type, arg.version, arg.modLoaderVersion);
	let instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances });
});

ipcMain.on("GET_INSTANCES", async (event, arg): Promise<void> => {
	let instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances });
});

ipcMain.on("START_INSTANCE", async (event, arg): Promise<void> => {
	InstanceManager.loadInstances();
	let instance = InstanceManager.getInstance(arg.uuid);
	if (!instance) {
		return;
	}
	try {
		let logWindow: BrowserWindow = null;
		startGame(
			instance,
			() => {
				event.sender.send("INSTANCE_STARTED", { uuid: instance.uuid });
				DiscordRPC.setActivity("Playing Minecraft", instance.name, "rainbow_clouds", "Custom Launcher", "rainbow_clouds", "Playing some Minecraft", true);
				DiscordRPC.setPlaying(true);

				if (Settings.get_key("open_log_on_launch")) {
					logWindow = new BrowserWindow({
						height: 600,
						width: 800,
						webPreferences: {
							nodeIntegration: true,
							contextIsolation: false,
						},
						frame: true,
						autoHideMenuBar: true,
					});

					logWindow.removeMenu();

					logWindow.setTitle("Minecraft Log - " + instance.name);

					logWindow.loadURL(DASHBOARD_WEBPACK_ENTRY + "#/log");

					logWindow.on("closed", () => {
						logWindow = null;
					});

					Browser.mainWindow.on("closed", () => {
						if (logWindow != null) {
							logWindow.close();
							logWindow = null;
						}
					});
				}
			},
			(msg: string) => {
				if (Browser.mainWindow != null) {
					Browser.mainWindow.webContents.executeJavaScript(`console.log("${msg.replace(/(\r\n|\n|\r)/gm, "")}")`);
				}
				if (logWindow != null) {
					logWindow.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent("gamelog", {detail: "${msg.replace(/(\r\n|\n|\r)/gm, "")}"}))`);
				}
			},
			() => {
				DiscordRPC.setPlaying(false);
				event.sender.send("SET_RPC", {});
				if (logWindow != null) {
					logWindow.close();
					logWindow = null;
				}
			}
		);
	} catch (e: any) {
		event.sender.send("ERROR", { title: "Error starting game!", description: e instanceof Error ? e.message : e });
		event.sender.send("INSTANCE_START_ERROR", { uuid: instance.uuid, error: e instanceof Error ? e.message : e });
	}
});

ipcMain.on("ADD_USER", async (event, arg): Promise<void> => {
	try {
		let user = await UserManager.login();
	} catch (e: any) {
		if (e instanceof Error || e != "Login window closed") {
			event.sender.send("ERROR", { title: "Error logging in!", description: e instanceof Error ? e.message : e });
		}
	}
	event.sender.send("GET_USERS", { users: UserManager.users });
});

ipcMain.on("GET_USERS", async (event, arg): Promise<void> => {
	event.sender.send("GET_USERS", { users: UserManager.users });
});

ipcMain.on("GET_USER", async (event, arg): Promise<void> => {
	event.sender.send("GET_USER", { user: UserManager.currentUser });
});

ipcMain.on("SET_CURRENT_USER", async (event, arg): Promise<void> => {
	UserManager.set_current_user(arg.uuid);
	event.sender.send("SET_CURRENT_USER", {});
});

ipcMain.on("DELETE_USER", async (event, arg): Promise<void> => {
	UserManager.delete_user(arg.uuid);
	event.sender.send("GET_USERS", { user: UserManager.users });
});

ipcMain.on("SET_RPC", async (event, arg): Promise<void> => {
	DiscordRPC.setActivity(arg.details, arg.state, arg.largeImageKey, arg.largeImageText, arg.smallImageKey, arg.smallImageText);
});

ipcMain.on("SET_SETTING", async (event, arg): Promise<void> => {
	Settings.set_key(arg.key, arg.value);
});

ipcMain.handle("GET_SETTING", async (event, arg): Promise<any> => {
	return Settings.get_key(arg.key);
});

ipcMain.handle("GET_INSTANCE", async (event, arg): Promise<any> => {
	return InstanceManager.getInstance(arg.uuid);
});

ipcMain.on("SET_INSTANCE_SETTING", async (event, arg): Promise<void> => {
	let instance = InstanceManager.getInstance(arg.uuid);
	if (!instance) {
		return;
	}
	instance.set_key(arg.key, arg.value);
	InstanceManager.updateInstance(arg.uuid, instance);
});
