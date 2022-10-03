import { displayError } from "../../handleError";
import electron from "electron";
import fetch from "node-fetch";
import { User } from "./user";

export function login() {}

export function microsoftLogin(): Promise<any> {
	return new Promise(async (resolve, reject) => {
		let code = await show_microsoft_login();
		let token = await get_microsoft_token(code);
		let xbox_live = await get_xbox_token(token.access_token);
		let xsts = await get_xsts_token(xbox_live.Token);
		let mc_token = await get_minecraft_token(xsts.DisplayClaims.xui[0].uhs, xsts.Token);
		let user = await User.create(token, mc_token);
		// console.log(code, token, xbox_live, xsts, mc_token, user);
		resolve(user);
	});
}

async function show_microsoft_login(): Promise<String> {
	return new Promise<String>((resolve, reject) => {
		const win = new electron.BrowserWindow({
			width: 800,
			height: 600,
		});

		win.loadURL("https://login.live.com/oauth20_authorize.srf?client_id=" + process.env.CLIENT_ID + "&response_type=code&redirect_uri=" + process.env.REDIRECT_URI + "&scope=XboxLive.signin%20offline_access&state=NOT_NEEDED");

		win.webContents.on("did-navigate", async (event, url) => {
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
		});
	});
}

async function get_microsoft_token(code: String): Promise<any> {
	let res = await fetch(process.env.TOKEN_URI + "?code=" + code);
	let json = await res.json();
	return json;
}

async function get_xbox_token(access_token: string): Promise<any> {
	let res = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
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
	let json = await res.json();
	return json;
}

async function get_xsts_token(token: string): Promise<any> {
	let res = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
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
	let json = await res.json();
	return json;
}

async function get_minecraft_token(userhash: string, token: string): Promise<any> {
	let res = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
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
	let json = await res.json();
	return json;
}
