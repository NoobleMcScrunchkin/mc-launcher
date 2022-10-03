import { readFileSync, mkdirSync, createWriteStream, existsSync } from "fs";
import fetch from "node-fetch";
import https from "https";
import path from "path";
import { app } from "electron";
import { v4 } from "uuid";

export class Instance {
	uuid: string = "00000000-0000-0000-0000-000000000000";
	type: string = "";
	version: string = "";
	mc_dir: string = "";
	natives_dir: string = ".";
	libraries: Array<String> = [];
	asset_index: string = "";
	assets_dir: string = "";
	java_version: number = 0;
	main_class: string = "";
	version_json: any = {};
	java_args: string = "";
	mc_args: string = "";
	version_type: string = "release";

	constructor(type: "vanilla" | "fabric" | "forge", version: string) {
		this.uuid = v4();
		this.type = type;
		this.version = version;
		this.mc_dir = path.resolve(app.getAppPath() + "/Storage/instances/" + this.uuid);
	}

	static async create(type: "vanilla" | "fabric" | "forge", version: string): Promise<Instance> {
		let instance = new Instance(type, version);
		await instance.download_version_info();
		await instance.init_data();
		return instance;
	}

	async download_version_info() {
		console.log("Downloading version information");
		let manifest = JSON.parse(readFileSync(app.getAppPath() + "/Storage/version_manifest_v2.json").toString());
		let version = manifest.versions.find((v: any) => v.id == this.version);
		if (version) {
			let res = await fetch(version.url);
			let versionJson = await res.json();
			this.version_json = versionJson;
			this.asset_index = this.version_json.assetIndex.id;
			this.java_version = this.version_json.javaVersion.majorVersion;
			this.main_class = this.version_json.mainClass;
			this.version_type = this.version_json.type;

			await this.download_assets();
		}
	}

	download_asset_index(id: string, url: string, location: string): Promise<any> {
		console.log("Downloading Asset Index: " + url);
		return new Promise<any>((resolve, reject) => {
			https.get(url, (res) => {
				mkdirSync(location, { recursive: true });
				const dlpath = location + "/" + id + ".json";
				const filePath = createWriteStream(dlpath);
				res.pipe(filePath);
				filePath.on("finish", async () => {
					filePath.close();
					console.log("Download Completed");
					let file = readFileSync(dlpath);
					let json = JSON.parse(file.toString());
					resolve(json);
				});
			});
		});
	}

	async download_assets() {
		console.log("Downloading Assets");

		let assets_dir = app.getAppPath() + "/Storage/assets/";
		this.assets_dir = path.resolve(assets_dir);

		let assetIndex = await this.download_asset_index(this.version_json.assetIndex.id, this.version_json.assetIndex.url, assets_dir + "indexes/");

		if (!assetIndex.objects) {
			return;
		}

		for (let key of Object.keys(assetIndex.objects)) {
			let obj = assetIndex.objects[key];
			let hash = obj.hash;
			if (!existsSync(assets_dir + "objects/" + hash.substring(0, 2) + "/" + hash)) {
				await this.download_asset(hash, assets_dir + "objects/");
			}
		}
	}

	download_asset(hash: string, assets_dir: string): Promise<boolean> {
		console.log("Downloading Asset: " + hash);
		return new Promise<boolean>((resolve, reject) => {
			https.get("https://resources.download.minecraft.net/" + hash.substring(0, 2) + "/" + hash, (res) => {
				mkdirSync(assets_dir + "/" + hash.substring(0, 2), { recursive: true });
				const dlpath = assets_dir + "/" + hash.substring(0, 2) + "/" + hash;
				const filePath = createWriteStream(dlpath);
				res.pipe(filePath);
				filePath.on("finish", () => {
					filePath.close();
					console.log("Download Completed");
					resolve(true);
				});
			});
		});
	}

	async init_data() {
		console.log("Init Data");
		if (this.version_json.downloads && this.version_json.downloads.client && this.version_json.downloads.client.url) {
			if (!existsSync(app.getAppPath() + "/Storage/versions/" + this.version + "/" + this.version + ".jar")) {
				await this.download_client();
			}
		}

		if (this.version_json.libraries) {
			for (let lib of this.version_json.libraries) {
				if (!this.useLibrary(lib)) {
					continue;
				}

				let jarFile: string = "";
				let [libDomain, libName, libVersion, libNative] = lib.name.split(":");
				let jarPath = path.join(...libDomain.split("."), libName, libVersion);

				if (libNative == undefined) {
					let native = this.getNativesString(lib);
					jarFile = libName + "-" + libVersion + ".jar";

					if (native != "") {
						jarFile = libName + "-" + libVersion + "-" + native + ".jar";
					}
				} else {
					jarFile = libName + "-" + libVersion + "-" + libNative + ".jar";
				}

				let library: any = {
					name: lib.name,
					path: jarPath,
					file: jarFile,
				};

				this.libraries.push(library);

				if (!existsSync(app.getAppPath() + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
					await this.download_library(lib.downloads.artifact.url, jarPath, jarFile);
				}
			}
		}
	}

	download_library(url: string, path: string, file: string): Promise<boolean> {
		console.log("Downloading Library: " + file);
		return new Promise<boolean>((resolve, reject) => {
			https.get(url, (res) => {
				mkdirSync(app.getAppPath() + "/Storage/libraries/" + path, { recursive: true });
				const dlpath = app.getAppPath() + "/Storage/libraries/" + path + "/" + file;
				const filePath = createWriteStream(dlpath);
				res.pipe(filePath);
				filePath.on("finish", () => {
					filePath.close();
					console.log("Download Completed");
					resolve(true);
				});
			});
		});
	}

	getNativesString(library: any) {
		let arch;

		if (process.arch == "x64") {
			arch = "64";
		} else if (process.arch.toString() == "x32") {
			arch = "32";
		} else {
			console.error("Unsupported platform");
			process.exit(0);
		}

		let nativesStr = "";
		let usingNatives = false;
		let osrule: any;

		if (library.rules) {
			library.rules.forEach((rule: any) => {
				if (rule.action == "allow") {
					if (rule.os) {
						usingNatives = true;
						osrule = rule;
					}
				}
			});
		}

		if (!usingNatives) {
			return nativesStr;
		}

		let process_opsys = process.platform.toString();
		let opsys: String = "";

		if (process_opsys == "darwin") {
			opsys = "MacOS";
		} else if (process_opsys == "win32" || process_opsys == "win64") {
			opsys = "Windows";
		} else if (process_opsys == "linux") {
			opsys = "Linux";
		}

		if (library["natives"]) {
			if ("windows" in library["natives"] && opsys == "Windows") {
				nativesStr = library["natives"]["windows"].replace("${arch}", arch);
			} else if ("osx" in library["natives"] && opsys == "MacOS") {
				nativesStr = library["natives"]["osx"].replace("${arch}", arch);
			} else if ("linux" in library["natives"] && opsys == "Linux") {
				nativesStr = library["natives"]["linux"].replace("${arch}", arch);
			} else {
				console.error("Unsupported platform");
				process.exit(0);
			}
		} else if (osrule) {
			nativesStr = osrule.os.name;
			if (arch != "64") {
				nativesStr += "-" + osrule.os.arch;
			}
		}

		return nativesStr;
	}

	useLibrary(lib: any) {
		if (!("rules" in lib)) {
			return true;
		}

		for (let rule in lib.rules) {
			if (this.ruleAllows(lib.rules[rule])) {
				return true;
			}
		}
		return false;
	}

	ruleAllows(rule: any) {
		let useLib;

		if (rule["action"] == "allow") {
			useLib = false;
		} else {
			useLib = true;
		}

		let process_opsys = process.platform.toString();
		let opsys: String = "";

		if (process_opsys == "darwin") {
			opsys = "MacOS";
		} else if (process_opsys == "win32" || process_opsys == "win64") {
			opsys = "Windows";
		} else if (process_opsys == "linux") {
			opsys = "Linux";
		}

		if (rule["os"]) {
			if (rule["os"]["name"]) {
				let value = rule["os"]["name"];
				if (value == "windows" && opsys != "Windows") {
					return useLib;
				} else if (value == "osx" && opsys != "MacOS") {
					return useLib;
				} else if (value == "linux" && opsys != "Linux") {
					return useLib;
				}
			}
			if (rule["os"]["arch"]) {
				if (rule["os"]["arch"] == "x86" && process.arch.toString() != "x32") {
					return useLib;
				}
			}
		}

		return !useLib;
	}

	async download_client(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			https.get(this.version_json.downloads.client.url, (res) => {
				mkdirSync(app.getAppPath() + "/Storage/versions/" + this.version, { recursive: true });
				const path = app.getAppPath() + "/Storage/versions/" + this.version + "/" + this.version + ".jar";
				const filePath = createWriteStream(path);
				res.pipe(filePath);
				filePath.on("finish", () => {
					filePath.close();
					console.log("Download Completed");
					resolve();
				});
			});
		});
	}

	get_classpath(): string {
		let base = path.resolve(app.getAppPath() + "/Storage/libraries/");
		let classpath = "";

		this.libraries.forEach((lib: any) => {
			classpath += path.join(base, lib.path, lib.file) + ";";
		});

		classpath += path.resolve(app.getAppPath() + "/Storage/versions/" + this.version + "/" + this.version + ".jar");

		return classpath;
	}
}
