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
exports.microsoftLogin = exports.login = void 0;
const electron_1 = __importDefault(require("electron"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const user_1 = require("./user");
function login() { }
exports.login = login;
function microsoftLogin() {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let code = yield show_microsoft_login();
        let token = yield get_microsoft_token(code);
        let xbox_live = yield get_xbox_token(token.access_token);
        let xsts = yield get_xsts_token(xbox_live.Token);
        let mc_token = yield get_minecraft_token(xsts.DisplayClaims.xui[0].uhs, xsts.Token);
        let user = yield user_1.User.create(token, mc_token);
        // console.log(code, token, xbox_live, xsts, mc_token, user);
        resolve(user);
    }));
}
exports.microsoftLogin = microsoftLogin;
function show_microsoft_login() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const win = new electron_1.default.BrowserWindow({
                width: 800,
                height: 600,
            });
            win.loadURL("https://login.live.com/oauth20_authorize.srf?client_id=" + process.env.CLIENT_ID + "&response_type=code&redirect_uri=" + process.env.REDIRECT_URI + "&scope=XboxLive.signin%20offline_access&state=NOT_NEEDED");
            win.webContents.on("did-navigate", (event, url) => __awaiter(this, void 0, void 0, function* () {
                if (url.includes("https://aslett.io:2048/microsoft/callback")) {
                    win.hide();
                    if (url.includes("error=")) {
                        let error = url.split("error=")[1].split("&")[0];
                        reject(error);
                        return;
                    }
                    const code = url.split("code=")[1].split("&")[0];
                    resolve(code);
                    win.close();
                }
            }));
        });
    });
}
function get_microsoft_token(code) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield (0, node_fetch_1.default)(process.env.TOKEN_URI + "?code=" + code);
        let json = yield res.json();
        return json;
    });
}
function get_xbox_token(access_token) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield (0, node_fetch_1.default)("https://user.auth.xboxlive.com/user/authenticate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: "d=" + access_token,
                },
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT",
            }),
        });
        let json = yield res.json();
        return json;
    });
}
function get_xsts_token(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield (0, node_fetch_1.default)("https://xsts.auth.xboxlive.com/xsts/authorize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [token],
                },
                RelyingParty: "rp://api.minecraftservices.com/",
                TokenType: "JWT",
            }),
        });
        let json = yield res.json();
        return json;
    });
}
function get_minecraft_token(userhash, token) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield (0, node_fetch_1.default)("https://api.minecraftservices.com/authentication/login_with_xbox", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                identityToken: `XBL3.0 x=${userhash};${token}`,
                ensureLegacyEnabled: true,
            }),
        });
        let json = yield res.json();
        return json;
    });
}
