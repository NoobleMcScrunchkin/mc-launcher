import { displayError } from "../../handleError";
import electron from "electron";
import fetch from "node-fetch";
import { User } from "./user";

export function microsoftLogin(): Promise<any> {
	return new Promise(async (resolve, reject) => {
		try {
			let code = await show_microsoft_login();
			let token = await get_microsoft_token(code);
			let xbox_live = await get_xbox_token(token.access_token);
			let xsts = await get_xsts_token(xbox_live.Token);
			let mc_token = await get_minecraft_token(xsts.DisplayClaims.xui[0].uhs, xsts.Token);
			let user = await User.create(token, mc_token);
			resolve(user);
		} catch (e: any) {
			displayError(e.toString());
			reject(e);
		}
	});
}

export function token_update(refresh_token: string): Promise<any> {
	return new Promise<any>(async (resolve, reject) => {
		try {
			let token = await refresh_ms_token(refresh_token);
			let xbox_live = await get_xbox_token(token.access_token);
			let xsts = await get_xsts_token(xbox_live.Token);
			let mc_token = await get_minecraft_token(xsts.DisplayClaims.xui[0].uhs, xsts.Token);
			resolve({
				ms_token: token,
				mc_token: mc_token,
			});
		} catch (e: any) {
			displayError(e.toString());
			reject(e);
		}
	});
}

async function show_microsoft_login(): Promise<String> {
	return new Promise<String>((resolve, reject) => {
		const win = new electron.BrowserWindow({
			width: 800,
			height: 600,
		});

		win.loadURL("https://login.live.com/oauth20_authorize.srf?client_id=a68214e1-52ba-4903-8f03-87e5f2a22b74&response_type=code&redirect_uri=https://aslett.io:2048/microsoft/callback&scope=XboxLive.signin%20offline_access&state=NOT_NEEDED&prompt=login");

		win.webContents.on("did-navigate", async (event, url) => {
			try {
				if (url.startsWith("https://aslett.io:2048/microsoft/callback")) {
					win.hide();
					if (url.includes("error=")) {
						let error = url.split("error=")[1].split("&")[0];
						let error_desc = url.split("error_description=")[1].split("&")[0];
						reject(error + ": " + error_desc);
						return;
					}
					const code = url.split("code=")[1].split("&")[0];
					resolve(code);
					win.close();
				}
			} catch (e) {
				reject(e);
			}
		});
	});
}

function get_microsoft_token(code: String): Promise<any> {
	return new Promise<any>(async (resolve, reject) => {
		let res = await fetch("https://aslett.io:2048/microsoft/token?code=" + code);
		if (res.status != 200) {
			reject("Failed to get Microsoft token");
			return;
		}
		let json = await res.json();
		resolve(json);
	});
}

function refresh_ms_token(refresh_token: string): Promise<any> {
	return new Promise<any>(async (resolve, reject) => {
		let res = await fetch("https://aslett.io:2048/microsoft/refresh?refresh_token=" + refresh_token);
		if (res.status != 200) {
			reject("Failed to refresh Microsoft token");
			return;
		}
		let json = await res.json();
		resolve(json);
	});
}

function get_xbox_token(access_token: string): Promise<any> {
	return new Promise<any>(async (resolve, reject) => {
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
		if (res.status != 200) {
			reject("Failed to get xbox token");
			return;
		}
		let json = await res.json();
		resolve(json);
	});
}

function get_xsts_token(token: string): Promise<any> {
	return new Promise<any>(async (resolve, reject) => {
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
		if (res.status != 200) {
			reject("Failed to get xsts token");
			return;
		}
		let json = await res.json();
		resolve(json);
	});
}

function get_minecraft_token(userhash: string, token: string): Promise<any> {
	return new Promise<any>(async (resolve, reject) => {
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
		if (res.status != 200) {
			reject("Failed to get Minecraft token");
			return;
		}
		let json = await res.json();
		resolve(json);
	});
}
