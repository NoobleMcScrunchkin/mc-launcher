import path from "path";
import https from "https";
import { InstanceManager } from "./util/minecraft/game/instanceManager";
import { Browser } from "./util/electron/browser";
import { UserManager } from "./util/minecraft/auth/userManager";
import * as RPC from "discord-rpc";

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

const clientId = "1031380679340072992";

RPC.register(clientId);

const rpc = new RPC.Client({ transport: "ipc" });

async function setActivity() {
	if (!rpc) {
		return;
	}

	rpc.setActivity({
		details: `Doing the thing`,
		state: "Lots of coding, this isn't done yet",
		largeImageKey: "rainbow_clouds",
		largeImageText: "OwO",
		smallImageKey: "rainbow_clouds",
		smallImageText: "UwU",
		instance: false,
	});
}

rpc.on("ready", () => {
	setActivity();
});

rpc.login({ clientId }).catch(console.error);
