import { ipcMain } from "electron";
import { UserManager } from "../minecraft/auth/userManager";
import { InstanceManager } from "../minecraft/game/instanceManager";
import { startGame } from "../minecraft/game/launcher";
import { Browser } from "./browser";

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
	let instance = await InstanceManager.createInstance(arg.name, arg.type, arg.version);
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
	startGame(
		instance,
		() => {
			event.sender.send("INSTANCE_STARTED", { uuid: instance.uuid });
		},
		(error) => {
			event.sender.send("INSTANCE_START_ERROR", { uuid: instance.uuid, error });
		}
	);
});

ipcMain.on("ADD_USER", async (event, arg): Promise<void> => {
	let user = await UserManager.login();
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
