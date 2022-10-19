import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { Storage } from "./storage";

const dir_path: string = Storage.resourcesPath + "/Storage/";
const path: string = dir_path + "settings.json";

class SettingsStorage {
	open_log_on_launch: boolean = true;
}

export class Settings {
	static settings_storage: SettingsStorage = new SettingsStorage();

	static save_settings(): void {
		let json = JSON.stringify(Settings.settings_storage);
		mkdirSync(dir_path, { recursive: true });
		writeFileSync(path, json);
	}

	static load_settings(): void {
		if (existsSync(path)) {
			let json = JSON.parse(readFileSync(path).toString());
			Object.assign(this.settings_storage, json);
		}
		Settings.save_settings();
	}

	static get_key(key: string): any {
		return this.settings_storage[key as keyof typeof this.settings_storage];
	}

	static set_key(key: string, value: any): void {
		this.settings_storage[key as keyof typeof this.settings_storage] = value;
	}
}
