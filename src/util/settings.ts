import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { Storage } from "./storage";

const dir_path: string = Storage.resourcesPath + "/Storage/";
const path: string = dir_path + "settings.json";

const SettingsStorageTypes = {
	open_log_on_launch: "boolean",
	java8_path: "string",
	java17_path: "string",
};

class SettingsStorage {
	open_log_on_launch: string = "true";
	java8_path: string = "";
	java17_path: string = "";
}

export class Settings {
	static settings_storage: SettingsStorage = new SettingsStorage();
	static update_downloaded: boolean = false;

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
		let val = this.settings_storage[key as keyof typeof this.settings_storage];
		let type = SettingsStorageTypes[key as keyof typeof SettingsStorageTypes];
		if (type == "boolean") {
			return val == "true";
		} else if (type == "number") {
			return Number(val);
		} else {
			return val;
		}
	}

	static set_key(key: string, value: any): void {
		this.settings_storage[key as keyof typeof this.settings_storage] = value.toString();
		Settings.save_settings();
	}
}
