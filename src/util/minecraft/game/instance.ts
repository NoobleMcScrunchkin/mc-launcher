import { readFileSync, mkdirSync, createWriteStream, existsSync, createReadStream } from "fs";
import fetch from "node-fetch";
import https from "https";
import path from "path";
import { app } from "electron";
import { v4 } from "uuid";
import unzipper from "unzipper";
import { Storage } from "../../storage";

function get_platform() {
	let platform = process.platform;
	if (platform == "win32") {
		return "windows";
	} else if (platform == "darwin") {
		return "osx";
	} else if (platform == "linux") {
		return "linux";
	}
}

export class Instance {
	name: string = "";
	uuid: string = "00000000-0000-0000-0000-000000000000";
	type: string = "";
	version: string = "";
	loader_version: string = "";
	mc_dir: string = "";
	natives_dir: string = "";
	libraries: Array<String> = [];
	asset_index: string = "";
	assets_dir: string = "";
	java_version: number = 0;
	main_class: string = "";
	version_json: any = {};
	version_type: string = "release";

	constructor(name: string, type: "vanilla" | "fabric" | "forge", version: string, loader_version: string = "") {
		this.name = name;
		this.uuid = v4();
		this.type = type;
		this.version = version;
		this.loader_version = loader_version;
		this.mc_dir = path.resolve(Storage.resourcesPath + "/Storage/instances/" + this.uuid);
		this.natives_dir = this.mc_dir + "/natives";
	}

	static async create(name: string, type: "vanilla" | "fabric" | "forge", version: string, loader_version: string = ""): Promise<Instance> {
		let instance = new Instance(name, type, version, loader_version);
		await instance.download_version_info();
		await instance.init_data();
		return instance;
	}

	async download_version_info(): Promise<void> {
		console.log("Downloading version information");

		let mod_json: any = null;

		if (this.type == "fabric") {
			let res = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${this.version}/${this.loader_version}/profile/json`);
			mod_json = await res.json();

			let manifest = JSON.parse(readFileSync(Storage.resourcesPath + "/Storage/version_manifest_v2.json").toString());
			let version = manifest.versions.find((v: any) => v.id == mod_json.inheritsFrom);
			if (version) {
				let res = await fetch(version.url);
				let versionJson = await res.json();

				if (versionJson.libraries && mod_json.libraries) {
					versionJson.libraries.push(...mod_json.libraries);
				}

				if (versionJson.minecraftArguments && mod_json.minecraftArguments) {
					versionJson.minecraftArguments += " " + mod_json.minecraftArguments;
				}

				if (versionJson.arguments && mod_json.arguments) {
					if (mod_json.arguments.game && versionJson.arguments.game) {
						versionJson.arguments.game.push(...mod_json.arguments.game);
					}
					if (mod_json.arguments.jvm && versionJson.arguments.jvm) {
						versionJson.arguments.jvm.push(...mod_json.arguments.jvm);
					}
				}

				versionJson.mainClass = mod_json.mainClass;

				this.version_json = versionJson;
				this.asset_index = this.version_json.assetIndex.id;
				if (this.version_json.javaVersion) {
					this.java_version = this.version_json.javaVersion.majorVersion;
				} else {
					this.java_version = 17;
				}
				this.main_class = this.version_json.mainClass;
				this.version_type = this.version_json.type;

				await this.download_assets();
			}
		} else if (this.type == "vanilla") {
			let manifest = JSON.parse(readFileSync(Storage.resourcesPath + "/Storage/version_manifest_v2.json").toString());
			let version = manifest.versions.find((v: any) => v.id == this.version);
			if (version) {
				let res = await fetch(version.url);
				let versionJson = await res.json();
				this.version_json = versionJson;
				this.asset_index = this.version_json.assetIndex.id;
				if (this.version_json.javaVersion) {
					this.java_version = this.version_json.javaVersion.majorVersion;
				} else {
					this.java_version = 17;
				}
				this.main_class = this.version_json.mainClass;
				this.version_type = this.version_json.type;

				await this.download_assets();
			}
		}
	}

	get_mc_args(): Array<string> {
		let mc_args: Array<string> = [...(this.version_json.minecraftArguments ? this.version_json.minecraftArguments.split(" ") : [])];

		if (this.version_json.arguments) {
			if (this.version_json.arguments.game) {
				this.version_json.arguments.game.forEach((arg: any) => {
					if (typeof arg !== "string" && arg.rules) {
						let add = false;
						arg.rules.forEach((rule: any) => {
							if (rule.action == "allow") {
								if (rule.os) {
									if (rule.os.name == get_platform() || rule.os.arch == process.arch) {
										add = true;
									}
								} else if (rule.features) {
									Object.keys(rule.features).forEach((feature: any) => {
										//TODO compare this against settings.
										if (rule.features[feature] == false) {
											add = true;
										}
									});
								} else {
									add = true;
								}
							}
						});
						if (add) {
							if (typeof arg.value == "string") {
								mc_args.push(arg.value);
							} else {
								mc_args.push(...arg.value);
							}
						}
					} else {
						mc_args.push(arg);
					}
				});
			}
		}

		return mc_args;
	}

	get_jvm_args(): Array<string> {
		let jvm_args: Array<string> = [];

		if (this.version_json.arguments) {
			if (this.version_json.arguments.jvm) {
				this.version_json.arguments.jvm.forEach((arg: any) => {
					if (typeof arg !== "string" && arg.rules) {
						let add = false;
						arg.rules.forEach((rule: any) => {
							if (rule.action == "allow") {
								if (rule.os) {
									if (rule.os.name == get_platform() || rule.os.arch == process.arch) {
										add = true;
									}
								} else if (rule.features) {
									Object.keys(rule.features).forEach((feature: any) => {
										//TODO compare this against settings.
										if (rule.features[feature] == false) {
											add = true;
										}
									});
								} else {
									add = true;
								}
							}
						});
						if (add) {
							if (typeof arg.value == "string") {
								jvm_args.push(arg.value);
							} else {
								jvm_args.push(...arg.value);
							}
						}
					} else {
						jvm_args.push(arg);
					}
				});
			}
		}

		if (jvm_args.length == 0) {
			return ["-Djava.library.path=${natives_directory}", "-Dminecraft.launcher.brand=custom-launcher", "-Dminecraft.launcher.version=1.0", "-cp", "${classpath}"];
		}

		return jvm_args;
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

	async download_assets(): Promise<void> {
		console.log("Downloading Assets");

		let assets_dir = Storage.resourcesPath + "/Storage/assets/";
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

	async init_data(): Promise<void> {
		console.log("Init Data");
		if (this.version_json.downloads && this.version_json.downloads.client && this.version_json.downloads.client.url) {
			if (!existsSync(Storage.resourcesPath + "/Storage/versions/" + this.version + "/" + this.version + ".jar")) {
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
					if (lib.downloads && lib.downloads.artifact && lib.downloads.artifact.url) {
						jarFile = libName + "-" + libVersion + ".jar";

						let library: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(library);

						if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
							await this.download_library(lib.downloads.artifact.url, jarPath, jarFile);
						}
					} else if (lib.url) {
						jarFile = libName + "-" + libVersion + ".jar";

						let library: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(library);

						if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
							await this.download_library(`${lib.url}/${jarPath}/${jarFile}`, jarPath, jarFile);
						}
					}

					let native_url = "";
					if (lib.natives && lib.natives[get_platform()]) {
						jarFile = libName + "-" + libVersion + "-natives-" + get_platform() + ".jar";
						if (!lib.downloads.classifiers || !lib.downloads.classifiers["natives-" + get_platform()]) {
							continue;
						}

						native_url = lib.downloads.classifiers["natives-" + get_platform()].url;

						let native_lib: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(native_lib);

						if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
							await this.download_library(native_url, jarPath, jarFile);
						}

						if (lib.extract) {
							await this.extract_natives(Storage.resourcesPath + "/Storage/libraries/" + jarPath, jarFile);
						}
					}
				} else {
					jarFile = libName + "-" + libVersion + "-" + libNative + ".jar";

					let library: any = {
						name: lib.name,
						path: jarPath,
						file: jarFile,
					};

					this.libraries.push(library);

					if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
						await this.download_library(lib.downloads.artifact.url, jarPath, jarFile);
					}

					if (lib.extract) {
						await this.extract_natives(Storage.resourcesPath + "/Storage/libraries/" + jarPath, jarFile);
					}
				}
			}
		}
	}

	extract_natives(jarPath: string, jarFile: string): void {
		console.log("Extracting Natives: " + jarFile);
		console.log(this.natives_dir);
		mkdirSync(this.natives_dir, { recursive: true });
		createReadStream(jarPath + "/" + jarFile).pipe(unzipper.Extract({ path: this.natives_dir }));
	}

	download_library(url: string, path: string, file: string): Promise<boolean> {
		console.log("Downloading Library: " + file);
		return new Promise<boolean>((resolve, reject) => {
			https.get(url, (res) => {
				mkdirSync(Storage.resourcesPath + "/Storage/libraries/" + path, { recursive: true });
				const dlpath = Storage.resourcesPath + "/Storage/libraries/" + path + "/" + file;
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

	useLibrary(lib: any): boolean {
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

	ruleAllows(rule: any): boolean {
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
				mkdirSync(Storage.resourcesPath + "/Storage/versions/" + this.version, { recursive: true });
				const path = Storage.resourcesPath + "/Storage/versions/" + this.version + "/" + this.version + ".jar";
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
		let base = path.resolve(Storage.resourcesPath + "/Storage/libraries/");
		let classpath = "";

		this.libraries.forEach((lib: any) => {
			classpath += path.join(base, lib.path, lib.file) + (process.platform == "win32" ? ";" : ":");
		});

		classpath += path.resolve(Storage.resourcesPath + "/Storage/versions/" + this.version + "/" + this.version + ".jar");

		return classpath;
	}
}
