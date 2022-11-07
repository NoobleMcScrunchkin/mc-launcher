import { ipcMain, BrowserWindow } from "electron";
import { UserManager } from "../minecraft/auth/userManager";
import { InstanceManager } from "../minecraft/game/instanceManager";
import { startGame } from "../minecraft/game/launcher";
import { Browser } from "./browser";
import { DiscordRPC } from "../discord/rpc";
import { Settings } from "../settings";
import { readFileSync } from "fs";
import { Storage } from "../storage";
import fetch from "node-fetch";

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
	let instances = InstanceManager.getInstances();
	InstanceManager.inprogress = InstanceManager.inprogress + 1;
	event.sender.send("GET_INSTANCES", { instances, inprogress: InstanceManager.inprogress });

	let instance = await InstanceManager.createInstance(arg.name, arg.type, arg.version, arg.modLoaderVersion);
	instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances, inprogress: InstanceManager.inprogress });
});

ipcMain.on("CREATE_INSTANCE_MODPACK", async (event, arg): Promise<void> => {
	let instances = InstanceManager.getInstances();
	InstanceManager.inprogress = InstanceManager.inprogress + 1;
	event.sender.send("GET_INSTANCES", { instances, inprogress: InstanceManager.inprogress });

	let instance = await InstanceManager.createInstanceFromModpack(arg.name, arg.project, arg.file);
	instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances, inprogress: InstanceManager.inprogress });
});

ipcMain.on("DELETE_INSTANCE", async (event, arg): Promise<void> => {
	InstanceManager.removeInstance(arg.uuid);
	event.sender.send("GET_INSTANCES", { instances: InstanceManager.getInstances(), inprogress: InstanceManager.inprogress });
});

ipcMain.on("GET_INSTANCES", async (event, arg): Promise<void> => {
	let instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances, inprogress: InstanceManager.inprogress });
});

ipcMain.on("START_INSTANCE", async (event, arg): Promise<void> => {
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

				InstanceManager.front_order(instance.uuid);
				event.sender.send("GET_INSTANCES", { instances: InstanceManager.instances, inprogress: InstanceManager.inprogress });

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
					Browser.mainWindow.webContents.executeJavaScript(`console.log("${msg.replace(/(\r\n|\n|\r)/gm, "").replaceAll('"', '\\"')}")`);
				}
				if (logWindow != null) {
					logWindow.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent("gamelog", {detail: "${msg.replace(/(\r\n|\n|\r)/gm, "").replaceAll('"', '\\"')}" }));`);
				}
			},
			() => {
				DiscordRPC.setPlaying(false);
				event.sender.send("SET_RPC", {});
				if (logWindow != null) {
					logWindow.close();
					logWindow = null;
				}
			},
			(e) => {
				event.sender.send("ERROR", { title: "Error starting game!", description: e });
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

ipcMain.handle("GET_VERSIONS", async (event, arg): Promise<any> => {
	if (arg.modloader) {
		if (arg.modloader == "fabric") {
			let res = await fetch("https://meta.fabricmc.net/v2/versions/loader");
			let json = await res.json();
			return json.map((v: any) => {
				return { id: v.version };
			});
		} else if (arg.modloader == "forge") {
			let res = await fetch("https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json");
			let json = await res.json();
			return json[arg.version]
				.map((v: any) => {
					return { id: v.split("-")[1] };
				})
				.reverse();
		}
	} else {
		return JSON.parse(readFileSync(Storage.resourcesPath + "/Storage/version_manifest_v2.json").toString()).versions;
	}
});

ipcMain.handle("GET_MODPACKS", async (event, arg): Promise<any> => {
	let res = await fetch(`https://api.curseforge.com/v1/mods/search?gameId=432&categoryId=0&pageSize=40&index=${arg.page * 40 || 0}&sortField=1&sortOrder=desc&gameVersion=&classId=4471&searchFilter=${arg.search || ""}`, {
		headers: {
			"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
		},
	});
	let json = await res.json();
	return json.data;
});

ipcMain.handle("GET_MODPACK_SUMMARY", async (event, arg): Promise<any> => {
	let res = await fetch(`https://api.curseforge.com/v1/mods/${arg.project}/description`, {
		headers: {
			"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
		},
	});
	let json = await res.json();
	return json.data;
});

ipcMain.handle("GET_MODPACK_VERSIONS", async (event, arg): Promise<any> => {
	let res = await fetch(`https://api.curseforge.com/v1/mods/${arg.project}/files`, {
		headers: {
			"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
		},
	});
	let json = await res.json();
	return json.data;
});
