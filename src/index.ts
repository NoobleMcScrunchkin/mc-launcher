import path from "path";
import https from "https";
import { InstanceManager } from "./util/minecraft/game/instanceManager";
import { Browser } from "./util/electron/browser";
import { UserManager } from "./util/minecraft/auth/userManager";
import { DiscordRPC } from "./util/discord/rpc";
import { Settings } from "./util/settings";
import { autoUpdater } from "electron";
require("update-electron-app")({
	notifyUser: false,
});

autoUpdater.on("update-downloaded", () => {
	Settings.update_downloaded = true;
});

const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path.resolve(__dirname, `${process.resourcesPath}/intermediate.pem`));
https.globalAgent.options.ca = rootCas;

Settings.load_settings();
InstanceManager.update_versions();
InstanceManager.loadInstances();
UserManager.loadUsers();
Browser.init();
DiscordRPC.init();
