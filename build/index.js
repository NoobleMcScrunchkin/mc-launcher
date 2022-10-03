"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const electron_1 = __importDefault(require("electron"));
const login_1 = require("./util/minecraft/auth/login");
const launcher_1 = require("./util/minecraft/game/launcher");
const electron_2 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const instance_1 = require("./util/minecraft/game/instance");
const rootCas = require("ssl-root-cas").create();
rootCas.addFile(path_1.default.resolve(__dirname, "../intermediate.pem"));
const httpsAgent = new https_1.default.Agent({ ca: rootCas });
https_1.default.globalAgent.options.ca = rootCas;
dotenv_1.default.config();
function update_versions() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            https_1.default.get("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", (res) => {
                const path = `${__dirname}/../Storage/version_manifest_v2.json`;
                const filePath = fs_1.default.createWriteStream(path);
                res.pipe(filePath);
                filePath.on("finish", () => {
                    filePath.close();
                    console.log("Download Completed");
                    resolve();
                });
            });
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // await update_versions();
        const win = new electron_1.default.BrowserWindow({
            width: 800,
            height: 600,
        });
        let user = yield (0, login_1.microsoftLogin)();
        let instance = yield instance_1.Instance.create("vanilla", "1.19.2", `${__dirname}/../Storage/mc`);
        (0, launcher_1.startGame)(instance, user);
    });
}
electron_2.app.on("ready", () => {
    main();
});
