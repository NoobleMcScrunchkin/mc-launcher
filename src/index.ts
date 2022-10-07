import path from "path";
import https from "https";
import { InstanceManager } from "./util/minecraft/game/instanceManager";
import { Browser } from "./util/electron/browser";
import { UserManager } from "./util/minecraft/auth/userManager";

const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path.resolve(__dirname, `${process.resourcesPath}/intermediate.pem`));
const httpsAgent = new https.Agent({ ca: rootCas });
https.globalAgent.options.ca = rootCas;

(async (): Promise<void> => {
	await InstanceManager.update_versions();
})();

InstanceManager.loadInstances();
UserManager.loadUsers();
Browser.init();
