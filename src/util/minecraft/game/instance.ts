import { readFileSync, mkdirSync, createWriteStream, existsSync, createReadStream, readdirSync, unlinkSync } from "fs";
import { copySync } from "fs-extra";
import fetch from "node-fetch";
import { https } from "follow-redirects";
import path from "path";
import { v4 } from "uuid";
import unzipper from "unzipper";
import { Storage } from "../../storage";
import { exec } from "child_process";
import { BrowserWindow } from "electron";
import { InstanceManager } from "./instanceManager";
import crypto from "crypto";
import * as semver from "semver";
import { Settings } from "../../settings";

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

const pathFromMaven = (maven: string) => {
	const pathSplit = maven.split(":");
	const fileName = pathSplit[3] ? `${pathSplit[2]}-${pathSplit[3]}` : pathSplit[2];
	const finalFileName = fileName.includes("@") ? fileName.replace("@", ".") : `${fileName}.jar`;
	const initPath = pathSplit[0].split(".").concat(pathSplit[1]).concat(pathSplit[2].split("@")[0]).concat(`${pathSplit[1]}-${finalFileName}`);
	return initPath.join("/");
};

export class Instance {
	name: string = "";
	uuid: string = "00000000-0000-0000-0000-000000000000";
	type: string = "";
	version: string = "";
	loader_version: string = "";
	mc_dir: string = "";
	natives_dir: string = "";
	libraries: Array<any> = [];
	asset_index: string = "";
	assets_dir: string = "";
	java_version: number = 0;
	main_class: string = "";
	version_json: any = {};
	version_type: string = "release";
	custom_jvm_args: string = "";
	jvm_memory: number = 2048;
	order: number = null;
	updating: boolean = false;
	modpack: boolean = false;
	modpack_mods: Array<string> = [];
	modpack_info: any = {
		name: "",
		project: "",
		file: "",
	};

	constructor() {}

	static create_constructor(name: string, type: string, version: string, loader_version: string = ""): Instance {
		let instance = new Instance();
		instance.name = name;
		instance.uuid = v4();
		instance.type = type;
		instance.version = version;
		instance.loader_version = loader_version;
		instance.mc_dir = path.resolve(Storage.resourcesPath + "/Storage/instances/" + instance.uuid);
		instance.natives_dir = instance.mc_dir + "/natives";
		instance.order = InstanceManager.instances.length;
		return instance;
	}

	static async create(name: string, type: "vanilla" | "fabric" | "forge", version: string, loader_version: string = "", uuid: string = null): Promise<Instance> {
		let instance = Instance.create_constructor(name, type, version, loader_version);
		await instance.init_data();
		return instance;
	}

	async update(type: "vanilla" | "fabric" | "forge", version: string, loader_version: string = "") {
		this.updating = true;
		this.type = type;
		this.version = version;
		this.loader_version = loader_version;
		this.libraries = [];
		await this.init_data();
		this.updating = false;
		InstanceManager.updateInstance(this.uuid, this);
	}

	async update_modpack(project_id: number, file_id: number) {
		this.updating = true;
		await Instance.create_from_modpack(null, project_id, file_id, this);
		this.updating = false;
		InstanceManager.updateInstance(this.uuid, this);
	}

	static async create_from_modpack(name: string, project_id: number, file_id: number, existing_instance: Instance = null): Promise<Instance> {
		let modpackRes = await fetch(`https://api.curseforge.com/v1/mods/${project_id}/files/${file_id}`, {
			headers: {
				"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
			},
		});

		let modpack: any = await modpackRes.json();

		const download_url = modpack.data.downloadUrl.replaceAll(" ", "%20");

		await (() => {
			return new Promise<boolean>((resolve, reject) => {
				https.get(download_url, (res) => {
					mkdirSync(path.resolve(Storage.resourcesPath + `/Storage/modpacks`), { recursive: true });
					const dlpath = path.resolve(Storage.resourcesPath + `/Storage/modpacks/${modpack.data.fileName}`);
					const filePath = createWriteStream(dlpath);
					res.pipe(filePath);
					filePath.on("finish", async () => {
						filePath.close();
						console.log("Download Completed");
						resolve(true);
					});
				});
			});
		})();

		if (modpack.data.fileName.endsWith(".zip")) {
			await (() => {
				return new Promise<boolean>((resolve, reject) => {
					const readStream = createReadStream(path.resolve(Storage.resourcesPath + `/Storage/modpacks/${modpack.data.fileName}`)).pipe(unzipper.Extract({ path: path.resolve(Storage.resourcesPath + `/Storage/modpacks/${modpack.data.fileName.replace(/\.[^/.]+$/, "")}`) }));
					readStream.on("close", () => {
						resolve(true);
					});
				});
			})();

			const modpack_dir = path.resolve(Storage.resourcesPath + `/Storage/modpacks/${modpack.data.fileName.replace(/\.[^/.]+$/, "")}`);

			const modpack_manifest = JSON.parse(readFileSync(modpack_dir + `/manifest.json`).toString());

			const version = modpack_manifest.minecraft.version;
			const type = modpack_manifest.minecraft.modLoaders[0].id.includes("fabric") ? "fabric" : "forge";
			const loader_version = modpack_manifest.minecraft.modLoaders[0].id.replace("fabric-", "").replace("forge-", "");

			let instance: Instance;
			if (existing_instance) {
				instance = existing_instance;
				instance.type = type;
				instance.version = version;
				instance.loader_version = loader_version;
				instance.libraries = [];
				instance.modpack_mods.forEach((mod) => {
					if (existsSync(instance.mc_dir + "/mods/" + mod)) {
						unlinkSync(instance.mc_dir + "/mods/" + mod);
					}
					if (existsSync(instance.mc_dir + "/mods/" + mod.replace(".jar", ".disabled"))) {
						unlinkSync(instance.mc_dir + "/mods/" + mod.replace(".jar", ".disabled"));
					}
					if (existsSync(instance.mc_dir + "/saves/" + mod)) {
						unlinkSync(instance.mc_dir + "/saves/" + mod);
					}
					if (existsSync(instance.mc_dir + "/resourcepacks/" + mod)) {
						unlinkSync(instance.mc_dir + "/resourcepacks/" + mod);
					}
				});
				instance.modpack_mods = [];
			} else {
				instance = Instance.create_constructor(name, type, version, loader_version);
			}

			instance.modpack = true;
			instance.modpack_info.name = modpack.data.displayName;
			instance.modpack_info.project = project_id;
			instance.modpack_info.file = file_id;

			await instance.init_data();

			const overrides_dir = modpack_dir + "/" + modpack_manifest.overrides;

			readdirSync(overrides_dir).forEach((file) => {
				copySync(overrides_dir + `/${file}`, instance.mc_dir + `/${file}`, { overwrite: true });
			});

			const mods_dir = instance.mc_dir + "/mods";
			mkdirSync(mods_dir, { recursive: true });

			const resource_packs_dir = instance.mc_dir + "/resourcepacks";
			mkdirSync(resource_packs_dir, { recursive: true });

			const worlds_dir = instance.mc_dir + "/saves";
			mkdirSync(worlds_dir, { recursive: true });

			for (let file of modpack_manifest.files) {
				let download_valid = false;

				let projectRes = await fetch(`https://api.curseforge.com/v1/mods/${file.projectID}`, {
					headers: {
						"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
					},
				});

				let project: any = await projectRes.json();

				let base_dir = "";

				if (project.data.classId == 6) {
					base_dir = mods_dir;
				} else if (project.data.classId == 12) {
					base_dir = resource_packs_dir;
				} else if (project.data.classId == 17) {
					base_dir = worlds_dir;
				}

				while (!download_valid) {
					let mod = await (() => {
						return new Promise<any>(async (resolve, reject) => {
							let modRes = await fetch(`https://api.curseforge.com/v1/mods/${file.projectID}/files/${file.fileID}`, {
								headers: {
									"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
								},
							});

							let mod: any = await modRes.json();

							instance.modpack_mods.push(mod.data.fileName);

							if (mod.data.downloadUrl) {
								https.get(mod.data.downloadUrl.replaceAll(" ", "%20"), (res) => {
									const dlpath = path.resolve(base_dir + "/" + mod.data.fileName);
									const filePath = createWriteStream(dlpath);
									res.pipe(filePath);
									console.log("Download Started");
									filePath.on("finish", async () => {
										filePath.close();
										console.log("Download Completed");
										resolve(mod);
									});
								});
							} else {
								let modInfoRes = await fetch(`https://api.curseforge.com/v1/mods/${file.projectID}`, {
									headers: {
										"x-api-key": "$2a$10$T8MZffSoJ/6HMP1FAAqJe.YLrpCHttNPSCNU3Rs85Q8BRzgOpd/Ai",
									},
								});

								let modInfo: any = await modInfoRes.json();

								let download_url = modInfo.data.links.websiteUrl + "/download/" + file.fileID;

								let dl_window = new BrowserWindow({
									height: 600,
									width: 800,
									frame: true,
									autoHideMenuBar: true,
									icon: path.resolve(process.resourcesPath + "/app.ico"),
								});

								dl_window.removeMenu();

								dl_window.loadURL(download_url);

								await (() => {
									return new Promise<boolean>(async (resolve, reject) => {
										dl_window.webContents.session.on("will-download", (event, item, webContents) => {
											item.setSavePath(path.resolve(base_dir + "/" + mod.data.fileName));

											item.on("updated", (event, state) => {
												if (state === "interrupted") {
													console.log("Download is interrupted but can be resumed");
												} else if (state === "progressing") {
													if (item.isPaused()) {
														console.log("Download is paused");
													} else {
														console.log(`Received bytes: ${item.getReceivedBytes()}`);
													}
												}
											});
											item.once("done", (event, state) => {
												if (state === "completed") {
													console.log("Download successfully");
												} else {
													console.log(`Download failed: ${state}`);
												}
												resolve(true);
												return;
											});
										});
									});
								})();

								dl_window.close();
								resolve(mod);
							}
						});
					})();

					let hashes = mod.data.hashes;
					download_valid = true;
					let fileBuffer = readFileSync(path.resolve(base_dir + "/" + mod.data.fileName));

					let sha1 = hashes.find((hash: any) => hash.algo === 1);

					if (sha1) {
						let hashSum = crypto.createHash("sha1");
						hashSum.update(fileBuffer);
						let hex = hashSum.digest("hex");
						// console.log(hex, sha1.value);
						download_valid = download_valid && hex === sha1.value;
					}

					let md5 = hashes.find((hash: any) => hash.algo === 2);

					if (md5) {
						let hashSum = crypto.createHash("md5");
						hashSum.update(fileBuffer);
						let hex = hashSum.digest("hex");
						// console.log(hex, md5.value);
						download_valid = download_valid && hex === md5.value;
					}

					console.log("Download Valid: " + download_valid);
				}
			}

			return instance;
		}
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
				let versionJson: any = await res.json();

				if (versionJson.libraries && mod_json.libraries) {
					versionJson.libraries.push(...mod_json.libraries);
				}

				if (versionJson.minecraftArguments && mod_json.minecraftArguments) {
					versionJson.minecraftArguments = mod_json.minecraftArguments;
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
		} else if (this.type == "forge") {
			let res = await fetch(`https://files.minecraftforge.net/maven/net/minecraftforge/forge/${this.version}-${this.loader_version}/forge-${this.version}-${this.loader_version}-installer.jar`);
			let installer = await res.buffer();
			let installerDirPath = path.resolve(Storage.resourcesPath + `/Storage/versions/forge-${this.version}-${this.loader_version}`);
			let installerFilePath = path.resolve(Storage.resourcesPath + `/Storage/versions/forge-${this.version}-${this.loader_version}/forge-${this.version}-${this.loader_version}-installer.jar`);
			mkdirSync(installerDirPath, { recursive: true });
			createWriteStream(installerFilePath).write(installer);

			await ((): Promise<void> => {
				return new Promise((resolve, reject) => {
					let java_path = Settings.get_key("java17_path") + "/jar";
					if (java_path == "" || !existsSync(java_path)) {
						throw "Java 17 path is invalid (Run setup in settings)";
					}
					let ext = process.platform.toString() == "win32" ? ".exe" : "";
					let jar = exec(`${java_path}${ext} xvf forge-${this.version}-${this.loader_version}-installer.jar`, { cwd: installerDirPath }, (error, stdout, stderr) => {
						if (error) {
							console.log(`error: ${error.message}`);
							reject(error);
							return;
						}
						if (stdout) {
							console.log(`stdout: ${stdout}`);
							return;
						}
						if (stderr) {
							console.log(`stderr: ${stderr}`);
							reject();
							return;
						}
					});

					jar.on("exit", (code) => {
						console.log(`Child exited with code ${code}`);
						if (code == 0) {
							resolve();
							return;
						}
						reject();
					});
				});
			})();

			let mod_json: any = {};
			let forgeInstallJson: any = {};

			if (existsSync(installerDirPath + "/version.json")) {
				mod_json = JSON.parse(readFileSync(installerDirPath + "/version.json").toString());
				forgeInstallJson = JSON.parse(readFileSync(installerDirPath + "/install_profile.json").toString());
			} else {
				forgeInstallJson = JSON.parse(readFileSync(installerDirPath + "/install_profile.json").toString());
				mod_json = forgeInstallJson.versionInfo;
				forgeInstallJson = forgeInstallJson.install;
			}

			if (existsSync(installerDirPath + `/forge-${this.version}-${this.loader_version}-universal.jar`)) {
				copySync(installerDirPath + `/forge-${this.version}-${this.loader_version}-universal.jar`, Storage.resourcesPath + `/Storage/libraries/net/minecraftforge/forge/${this.version}-${this.loader_version}/forge-${this.version}-${this.loader_version}.jar`, { overwrite: true });
			}

			if (existsSync(installerDirPath + "/data/client.lzma")) {
				mkdirSync(Storage.resourcesPath + `/Storage/libraries/net/minecraftforge/forge/${this.version}-${this.loader_version}/`, { recursive: true });
				copySync(installerDirPath + "/data/client.lzma", Storage.resourcesPath + `/Storage/libraries/net/minecraftforge/forge/${this.version}-${this.loader_version}/forge-${this.version}-${this.loader_version}-clientdata.lzma`);
				copySync(installerDirPath + "/data/client.lzma", Storage.resourcesPath + `/Storage/libraries/net/minecraftforge/forge/${this.version}-${this.loader_version}/forge-${this.version}-${this.loader_version}-universal-clientdata.lzma`);
			}
			if (existsSync(installerDirPath + "/maven")) {
				readdirSync(installerDirPath + "/maven").forEach((file) => {
					copySync(installerDirPath + "/maven" + `/${file}`, Storage.resourcesPath + "/Storage/libraries" + `/${file}`, { overwrite: true });
				});
			}

			if (forgeInstallJson.libraries) await this.download_libraries(forgeInstallJson.libraries, false);

			let manifest = JSON.parse(readFileSync(Storage.resourcesPath + "/Storage/version_manifest_v2.json").toString());
			let version = manifest.versions.find((v: any) => v.id == mod_json.inheritsFrom);
			if (version) {
				let res = await fetch(version.url);
				mkdirSync(path.resolve(Storage.resourcesPath + `/Storage/versions/${version.id}/`), { recursive: true });
				let versionJson: any = await res.json();
				createWriteStream(path.resolve(Storage.resourcesPath + `/Storage/versions/${version.id}/${version.id}.json`)).write(JSON.stringify(versionJson));

				if (versionJson.libraries && mod_json.libraries) {
					versionJson.libraries.push(...mod_json.libraries);
				}

				if (versionJson.minecraftArguments && mod_json.minecraftArguments) {
					versionJson.minecraftArguments = mod_json.minecraftArguments;
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

				if (this.version_json.downloads && this.version_json.downloads.client && this.version_json.downloads.client.url) {
					if (!existsSync(Storage.resourcesPath + "/Storage/versions/" + this.version + "/" + this.version + ".jar")) {
						await this.download_client();
					}
				}
			}

			if (forgeInstallJson.processors) {
				for (let processor of forgeInstallJson.processors) {
					if (processor.sides && !(processor.sides || []).includes("client")) {
						continue;
					}

					let jarExe = path.resolve(Storage.resourcesPath + "/Storage/libraries/" + pathFromMaven(processor.jar));
					let jarPath = path.parse(jarExe).dir;

					let classPath = "";

					for (let lib of processor.classpath) {
						classPath += path.resolve(Storage.resourcesPath + "/Storage/libraries/" + pathFromMaven(lib)) + (process.platform == "win32" ? ";" : ":");
					}

					classPath += jarExe;

					await ((): Promise<void> => {
						return new Promise((resolve, reject) => {
							let java_path = Settings.get_key("java17_path") + "/jar";
							if (java_path == "" || !existsSync(java_path)) {
								throw "Java 17 path is invalid (Run setup in settings)";
							}
							let ext = process.platform.toString() == "win32" ? ".exe" : "";
							let jar = exec(`${java_path}${ext} xf ${jarExe} META-INF/MANIFEST.MF`, { cwd: jarPath }, (error, stdout, stderr) => {
								if (error) {
									console.log(`error: ${error.message}`);
									reject(error);
									return;
								}
								if (stdout) {
									console.log(`stdout: ${stdout}`);
									return;
								}
								if (stderr) {
									console.log(`stderr: ${stderr}`);
									reject();
									return;
								}
							});

							jar.on("exit", (code) => {
								console.log(`Child exited with code ${code}`);
								if (code == 0) {
									resolve();
									return;
								}
								reject();
							});
						});
					})();

					let manifest = readFileSync(jarPath + "/META-INF/MANIFEST.MF").toString();
					let mainClassMatch = manifest.match(/[\n\r][ \t]*Main-Class: [ \t]*([^\n\r]*)/);
					let mainClass = mainClassMatch[0].replace("Main-Class: ", "").replace(/(\r\n|\n|\r)/gm, "");

					const universalPath = forgeInstallJson.libraries.find((v: any) => (v.name || "").startsWith("net.minecraftforge:forge"))?.name;

					const replaceIfPossible = (arg: string) => {
						const finalArg = arg.replace("{", "").replace("}", "");
						if (forgeInstallJson.data[finalArg]) {
							// Handle special case
							if (finalArg === "BINPATCH") {
								return `"${path.resolve(Storage.resourcesPath + "/Storage/libraries/" + pathFromMaven(forgeInstallJson.path || universalPath)).replace(".jar", "-clientdata.lzma")}"`;
							}
							// Return replaced string
							return forgeInstallJson.data[finalArg].client;
						}
						// Fix forge madness
						return arg
							.replace("{SIDE}", `client`)
							.replace("{ROOT}", `"${path.dirname(installerFilePath)}"`)
							.replace("{MINECRAFT_JAR}", `"${path.resolve(Storage.resourcesPath + `/Storage/versions/${forgeInstallJson.minecraft}/${forgeInstallJson.minecraft}.jar`)}"`)
							.replace("{MINECRAFT_VERSION}", `"${path.resolve(Storage.resourcesPath + `/Storage/versions/${version.id}/${version.id}.json`)}"`)
							.replace("{INSTALLER}", `"${installerFilePath}"`)
							.replace("{LIBRARY_DIR}", `"${path.resolve(Storage.resourcesPath + "/Storage/libraries/")}"`);
					};

					const computePathIfPossible = (arg: string) => {
						if (arg[0] === "[") {
							return `"${path.resolve(Storage.resourcesPath + "/Storage/libraries/" + pathFromMaven(arg.replace("[", "").replace("]", "")))}"`;
						}
						return arg;
					};

					const args = processor.args.map((arg: string) => replaceIfPossible(arg)).map((arg: string) => computePathIfPossible(arg));

					await ((): Promise<void> => {
						return new Promise((resolve, reject) => {
							let java_path = Settings.get_key("java17_path") + "/java";
							if (java_path == "" || !existsSync(java_path)) {
								throw "Java 17 path is invalid (Run setup in settings)";
							}
							let ext = process.platform.toString() == "win32" ? ".exe" : "";
							let jar = exec(`${java_path}${ext} -cp ${classPath} ${mainClass} ${args.join(" ")}`, { cwd: jarPath }, (error, stdout, stderr) => {
								if (error) {
									console.log(`error: ${error.message}`);
									reject(error);
									return;
								}
								if (stdout) {
									console.log(`stdout: ${stdout}`);
									return;
								}
								if (stderr) {
									console.log(`stderr: ${stderr}`);
									reject();
									return;
								}
							});

							jar.on("exit", (code) => {
								console.log(`Child exited with code ${code}`);
								if (code == 0) {
									resolve();
									return;
								}
								reject();
							});
						});
					})();
				}
			}
			await this.download_assets();
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
		await this.download_version_info();
		console.log("Init Data");
		if (this.version_json.downloads && this.version_json.downloads.client && this.version_json.downloads.client.url) {
			if (!existsSync(Storage.resourcesPath + "/Storage/versions/" + this.version + "/" + this.version + ".jar")) {
				await this.download_client();
			}
		}

		if (this.version_json.libraries) {
			await this.download_libraries(this.version_json.libraries);
		}
	}

	async download_libraries(libraries: any, add_to_libraries: boolean = true): Promise<void> {
		console.log("Downloading Libraries");
		for (let lib of libraries) {
			if (!this.useLibrary(lib)) {
				continue;
			}

			let jarFile: string = "";
			let [libDomain, libName, libVersion, libNative] = lib.name.split(":");
			let jarPath = path.join(...libDomain.split("."), libName, libVersion);
			jarPath = jarPath.split("@")[0];

			let existing = this.libraries.find((l) => {
				let existingArr = l.name.split(":");
				let newArr = lib.name.split(":");
				existingArr[2] = "9999";
				newArr[2] = "9999";
				if (lib.natives && newArr.length != 4) {
					return false;
				}
				return existingArr.join(":") == newArr.join(":");
			});

			if (existing && semver.gte(existing.name.split(":")[2], libVersion)) {
				console.log("skipping ", lib.name);
				continue;
			} else {
				if (existing) {
					console.log("slicing ", lib.name);
					this.libraries.splice(this.libraries.indexOf(existing), 1);
				}
			}

			if (libNative == undefined) {
				if (lib.downloads && lib.downloads.artifact && lib.downloads.artifact.url != undefined) {
					jarFile = libName + "-" + libVersion;
					if (jarFile.includes("@")) {
						jarFile = jarFile.replace("@", ".");
					} else {
						jarFile += ".jar";
					}

					if (add_to_libraries) {
						let library: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(library);
					}

					if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
						await this.download_library(lib.downloads.artifact.url, jarPath, jarFile);
					}
				} else if (lib.url) {
					jarFile = libName + "-" + libVersion;
					if (jarFile.includes("@")) {
						jarFile = jarFile.replace("@", ".");
					} else {
						jarFile += ".jar";
					}

					if (add_to_libraries) {
						let library: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(library);
					}

					if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
						await this.download_library(`${lib.url}/${jarPath}/${jarFile}`, jarPath, jarFile);
					}
				} else {
					jarFile = libName + "-" + libVersion;
					if (jarFile.includes("@")) {
						jarFile = jarFile.replace("@", ".");
					} else {
						jarFile += ".jar";
					}

					if (add_to_libraries) {
						let library: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(library);
					}
				}

				let native_url = "";
				if (lib.natives && lib.natives[get_platform()]) {
					jarFile = libName + "-" + libVersion + "-natives-" + get_platform();

					if (!lib.downloads.classifiers || !lib.downloads.classifiers["natives-" + get_platform()]) {
						continue;
					}

					native_url = lib.downloads.classifiers["natives-" + get_platform()].url;

					if (add_to_libraries) {
						let native_lib: any = {
							name: lib.name,
							path: jarPath,
							file: jarFile,
						};

						this.libraries.push(native_lib);
					}

					if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
						await this.download_library(native_url, jarPath, jarFile);
					}

					if (lib.extract) {
						await this.extract_natives(Storage.resourcesPath + "/Storage/libraries/" + jarPath, jarFile);
					}
				}
			} else {
				jarFile = libName + "-" + libVersion + "-" + libNative + ".jar";

				if (add_to_libraries) {
					let library: any = {
						name: lib.name,
						path: jarPath,
						file: jarFile,
					};

					this.libraries.push(library);
				}

				if (!existsSync(Storage.resourcesPath + "/Storage/libraries/" + jarPath + "/" + jarFile)) {
					await this.download_library(lib.downloads.artifact.url, jarPath, jarFile);
				}

				if (lib.extract) {
					await this.extract_natives(Storage.resourcesPath + "/Storage/libraries/" + jarPath, jarFile);
				}
			}
		}

		console.log("Finished Downloading Libraries");
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
			if (!url) {
				resolve(true);
				console.log("No URL");
				return;
			}
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

	get_key(key: string): any {
		return this[key as keyof typeof this];
	}

	set_key(key: string, value: any): void {
		this[key as keyof typeof this] = value;
	}
}
