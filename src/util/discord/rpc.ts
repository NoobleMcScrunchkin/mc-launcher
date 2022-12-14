import * as RPC from "discord-rpc";

export class DiscordRPC {
	static rpc: RPC.Client;
	static clientId: string = "1031380679340072992";
	static startTimestamp: Date;
	static playing: boolean;
	static connected: boolean = false;

	static init(doReady: boolean = true, callback: Function = () => {}) {
		try {
			this.startTimestamp = new Date();

			this.rpc = new RPC.Client({ transport: "ipc" });

			if (doReady) {
				this.rpc.on("ready", () => {
					this.setDefaultActivity();
				});
			}

			this.rpc
				.login({ clientId: this.clientId })
				.then(() => {
					DiscordRPC.connected = true;
					callback();
				})
				.catch(() => {
					this.rpc = null;
				});
		} catch (e) {
			this.rpc = null;
		}
	}

	static setDefaultActivity() {
		if (!this.rpc || !DiscordRPC.connected) {
			DiscordRPC.init(false, () => {
				DiscordRPC.setDefaultActivity();
			});
			return;
		}

		this.setActivity("In the main menu", "Viewing the dashboard", "rainbow_clouds", "Custom Launcher", "rainbow_clouds", "Getting ready to play some Minecraft");
	}

	static setActivity(details: string, state: string, largeImageKey: string, largeImageText: string, smallImageKey: string, smallImageText: string, newTimestamp: boolean = false) {
		if (!this.rpc || !DiscordRPC.connected) {
			DiscordRPC.init(false, () => {
				DiscordRPC.setActivity(details, state, largeImageKey, largeImageText, smallImageKey, smallImageText, newTimestamp);
			});
			return;
		}

		if (this.playing) {
			return;
		}

		if (newTimestamp) {
			this.startTimestamp = new Date();
		}

		this.rpc.setActivity({
			details,
			state,
			startTimestamp: this.startTimestamp,
			largeImageKey,
			largeImageText,
			smallImageKey,
			smallImageText,
			instance: false,
		});
	}

	static setPlaying(playing: boolean) {
		this.playing = playing;
	}
}
