import path from "path";
import https from "https";
import { InstanceManager } from "./util/minecraft/game/instanceManager";
import { Browser } from "./util/electron/browser";
import { UserManager } from "./util/minecraft/auth/userManager";
import { DiscordRPC } from "./util/discord/rpc";

const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path.resolve(__dirname, `${process.resourcesPath}/intermediate.pem`));
https.globalAgent.options.ca = rootCas;

InstanceManager.update_versions();
InstanceManager.loadInstances();
UserManager.loadUsers();
Browser.init();
DiscordRPC.init();
