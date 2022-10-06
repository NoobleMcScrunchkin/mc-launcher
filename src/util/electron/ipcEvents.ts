import { ipcMain } from "electron";
import { InstanceManager } from "../minecraft/game/instanceManager";
import { startGame } from "../minecraft/game/launcher";

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
	startGame(instance);
});
