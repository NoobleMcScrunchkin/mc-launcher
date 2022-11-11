import { ipcMain, BrowserWindow, autoUpdater } from "electron";
import { UserManager } from "../minecraft/auth/userManager";
import { InstanceManager } from "../minecraft/game/instanceManager";
import { startGame } from "../minecraft/game/launcher";
import { Browser } from "./browser";
import { DiscordRPC } from "../discord/rpc";
import { Settings } from "../settings";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, unlinkSync } from "fs";
import unzipper from "unzipper";
import { Storage } from "../storage";
import fetch from "node-fetch";
import { exec } from "child_process";
import crypto from "crypto";
import path from "path";
import { https } from "follow-redirects";
import tar from "tar";

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

ipcMain.on("UPDATE_INSTANCE", async (event, arg): Promise<void> => {
	let instance = InstanceManager.getInstance(arg.uuid);
	if (!instance) return;
	await instance.update(arg.type, arg.version, arg.modLoaderVersion);

	let instances = InstanceManager.getInstances();
	event.sender.send("GET_INSTANCES", { instances, inprogress: InstanceManager.inprogress });
});

ipcMain.on("UPDATE_INSTANCE_MODPACK", async (event, arg): Promise<void> => {
	let instance = InstanceManager.getInstance(arg.uuid);
	if (!instance) return;
	await instance.update_modpack(arg.project, arg.file);

	let instances = InstanceManager.getInstances();
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
						icon: path.resolve(process.resourcesPath + "/app.ico"),
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
		).catch((e) => {
			event.sender.send("ERROR", { title: "Error starting game!", description: e instanceof Error ? e.message : e });
			event.sender.send("INSTANCE_START_ERROR", { uuid: instance.uuid, error: e instanceof Error ? e.message : e });
		});
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

ipcMain.on("OPEN_INSTANCE_FOLDER", async (event, arg): Promise<any> => {
	let command = "";
	switch (process.platform) {
		case "darwin":
			command = "open";
			break;
		case "win32":
			command = "explorer";
			break;
		default:
			command = "xdg-open";
			break;
	}
	let dirPath = path.resolve(Storage.resourcesPath + "/Storage/instances/" + arg.uuid);
	exec(`${command} "${dirPath}"`);
});

function getInstanceMods(uuid: string) {
	let instance = InstanceManager.getInstance(uuid);
	if (!instance) {
		return [];
	}
	let mods_dir = instance.mc_dir + "/mods";
	let mods = [];
	if (existsSync(mods_dir)) {
		for (let file of readdirSync(mods_dir)) {
			if (file.endsWith(".jar") || file.endsWith(".disabled")) {
				mods.push(file);
			}
		}
	}
	return mods;
}

ipcMain.handle("GET_INSTANCE_MODS", async (event, arg): Promise<any> => {
	return getInstanceMods(arg.uuid);
});

ipcMain.handle("TOGGLE_MOD", async (event, arg): Promise<any> => {
	let instance = InstanceManager.getInstance(arg.uuid);
	if (!instance) {
		return [];
	}
	let mods_dir = instance.mc_dir + "/mods";

	if (existsSync(mods_dir)) {
		if (existsSync(mods_dir + `/${arg.mod}`)) {
			if (arg.mod.endsWith(".disabled")) {
				renameSync(mods_dir + `/${arg.mod}`, mods_dir + `/${arg.mod.replace(".disabled", ".jar")}`);
			} else {
				renameSync(mods_dir + `/${arg.mod}`, mods_dir + `/${arg.mod.replace(".jar", ".disabled")}`);
			}
		}
	}

	return getInstanceMods(arg.uuid);
});

ipcMain.handle("DOWNLOAD_JAVA", async (event, arg): Promise<any> => {
	console.log("Downloading Java");

	if (existsSync(path.resolve(Storage.resourcesPath + `/Storage/java`))) {
		rmSync(path.resolve(Storage.resourcesPath + `/Storage/java`), { recursive: true, force: true });
	}

	mkdirSync(path.resolve(Storage.resourcesPath + `/Storage/java`), { recursive: true });

	let java8Installed = false;
	let java17Installed = false;

	let os = process.platform.toString();
	os = os == "win32" ? "windows" : os;
	os = os == "darwin" ? "mac" : os;

	let java8res = await fetch("https://api.adoptium.net/v3/assets/latest/8/hotspot?image_type=jre");
	let java8json = await java8res.json();

	let java8obj = java8json.find((v: any) => {
		return v.binary.architecture == "x64" && v.binary.os == os;
	});

	if (java8obj) {
		const getDirectories = readdirSync(path.resolve(Storage.resourcesPath + `/Storage/java`), { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		let url = java8obj.binary.package.link;
		let name = java8obj.binary.package.name;
		let checksum = java8obj.binary.package.checksum;
		let download_valid = false;
		const dlpath = path.resolve(Storage.resourcesPath + `/Storage/java/${name}`);

		while (!download_valid) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					https.get(url, (res) => {
						const filePath = createWriteStream(dlpath);
						res.pipe(filePath);
						filePath.on("finish", async () => {
							filePath.close();
							console.log("Download Completed");
							resolve(true);
						});
					});
				});
			})();

			let fileBuffer = readFileSync(dlpath);
			let hashSum = crypto.createHash("sha256");
			hashSum.update(fileBuffer);
			let hex = hashSum.digest("hex");
			download_valid = hex == checksum;
		}

		if (dlpath.endsWith(".zip")) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					const readStream = createReadStream(dlpath).pipe(unzipper.Extract({ path: path.resolve(Storage.resourcesPath + `/Storage/java/`) }));
					readStream.on("close", () => {
						resolve(true);
					});
				});
			})();
		} else if (dlpath.endsWith(".tar.gz")) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					tar.extract({
						file: dlpath,
						cwd: path.resolve(Storage.resourcesPath + `/Storage/java/`),
					})
						.then(() => {
							resolve(true);
						})
						.catch((err) => {
							resolve(false);
						});
				});
			})();
		}

		unlinkSync(dlpath);

		const getCurDirectories = readdirSync(path.resolve(Storage.resourcesPath + `/Storage/java`), { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		let newDir = getCurDirectories.filter((v) => !getDirectories.includes(v))[0];

		if (newDir) {
			renameSync(path.resolve(Storage.resourcesPath + `/Storage/java/${newDir}`), path.resolve(Storage.resourcesPath + `/Storage/java/java8`));
			java8Installed = true;
		}
	}

	let java17res = await fetch("https://api.adoptium.net/v3/assets/latest/17/hotspot?image_type=jre");
	let java17json = await java17res.json();

	let java17obj = java17json.find((v: any) => {
		return v.binary.architecture == "x64" && v.binary.os == os;
	});

	if (java17obj) {
		const getDirectories = readdirSync(path.resolve(Storage.resourcesPath + `/Storage/java`), { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		let url = java17obj.binary.package.link;
		let name = java17obj.binary.package.name;
		let checksum = java17obj.binary.package.checksum;
		let download_valid = false;
		const dlpath = path.resolve(Storage.resourcesPath + `/Storage/java/${name}`);

		while (!download_valid) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					https.get(url, (res) => {
						const filePath = createWriteStream(dlpath);
						res.pipe(filePath);
						filePath.on("finish", async () => {
							filePath.close();
							console.log("Download Completed");
							resolve(true);
						});
					});
				});
			})();

			let fileBuffer = readFileSync(dlpath);
			let hashSum = crypto.createHash("sha256");
			hashSum.update(fileBuffer);
			let hex = hashSum.digest("hex");
			download_valid = hex == checksum;
		}

		if (dlpath.endsWith(".zip")) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					const readStream = createReadStream(dlpath).pipe(unzipper.Extract({ path: path.resolve(Storage.resourcesPath + `/Storage/java/`) }));
					readStream.on("close", () => {
						resolve(true);
					});
				});
			})();
		} else if (dlpath.endsWith(".tar.gz")) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					tar.extract({
						file: dlpath,
						cwd: path.resolve(Storage.resourcesPath + `/Storage/java/`),
					})
						.then(() => {
							resolve(true);
						})
						.catch((err) => {
							resolve(false);
						});
				});
			})();
		}

		unlinkSync(dlpath);

		const getCurDirectories = readdirSync(path.resolve(Storage.resourcesPath + `/Storage/java`), { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		let newDir = getCurDirectories.filter((v) => !getDirectories.includes(v))[0];

		if (newDir) {
			renameSync(path.resolve(Storage.resourcesPath + `/Storage/java/${newDir}`), path.resolve(Storage.resourcesPath + `/Storage/java/java17`));
			java17Installed = true;
		}
	}

	let ext = os == "windows" ? ".exe" : "";

	Settings.set_key("java8_path", java8Installed ? path.resolve(Storage.resourcesPath + `/Storage/java/java8/bin/java${ext}`) : "");
	Settings.set_key("java17_path", java8Installed ? path.resolve(Storage.resourcesPath + `/Storage/java/java17/bin/java${ext}`) : "");

	console.log("Finished Downloading Java");
	return { java8: java8Installed ? path.resolve(Storage.resourcesPath + `/Storage/java/java8/bin/java${ext}`) : "", java17: java17Installed ? path.resolve(Storage.resourcesPath + `/Storage/java/java17/bin/java${ext}`) : "" };
});

ipcMain.handle("GET_UPDATED_DOWNLOADED", async (event, arg): Promise<any> => {
	return Settings.update_downloaded;
});

ipcMain.on("DO_UPDATE", async (event, arg): Promise<any> => {
	autoUpdater.quitAndInstall();
});
