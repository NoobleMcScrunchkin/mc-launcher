import { Instance } from "./instance";
import https from "https";
import { existsSync, readFileSync, mkdirSync, writeFileSync, createWriteStream, rmSync } from "fs";
import { Storage } from "../../storage";

export class InstanceManager {
	static instances: Array<Instance> = [];
	static instances_path: string = Storage.resourcesPath + "/Storage/instances/";
	static json_path: string = this.instances_path + "/instances.json";
	static inprogress: number = 0;

	static update_versions(): Promise<void> {
		return new Promise((resolve, reject) => {
			https.get("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", (res) => {
				mkdirSync(`${Storage.resourcesPath}/Storage/`, { recursive: true });
				const path = `${Storage.resourcesPath}/Storage/version_manifest_v2.json`;
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

	static loadInstances(): void {
		let not_ordered = false;
		if (existsSync(this.json_path)) {
			let json = JSON.parse(readFileSync(this.json_path).toString());
			json.forEach((instance: any) => {
				if (!this.instances.find((i) => i.uuid == instance.uuid)) {
					let instanceObj = Object.setPrototypeOf(instance, Instance.prototype);
					not_ordered = not_ordered || instanceObj.order == null;
					instanceObj.updating = false;
					this.instances.push(instanceObj);
				}
			});
		}

		if (not_ordered) {
			this.instances.forEach((instance, i) => {
				instance.order = i;
			});
		}

		this.saveInstances();
	}

	static saveInstances(): void {
		let json = JSON.stringify(this.instances);
		mkdirSync(this.instances_path, { recursive: true });
		writeFileSync(this.json_path, json);
	}

	static async createInstance(name: string, type: "vanilla" | "fabric" | "forge", version: string, loader_version: string = ""): Promise<Instance> {
		let instance = await Instance.create(name, type, version, loader_version);
		InstanceManager.inprogress--;
		this.addInstance(instance);
		return instance;
	}

	static async createInstanceFromModpack(name: string, project: number, file: number): Promise<Instance> {
		let instance = await Instance.create_from_modpack(name, project, file);
		InstanceManager.inprogress--;
		this.addInstance(instance);
		return instance;
	}

	static addInstance(instance: Instance): void {
		this.instances.push(instance);
		this.saveInstances();
	}

	static removeInstance(uuid: string): void {
		let index = this.instances.findIndex((i) => i.uuid == uuid);
		this.instances.splice(index, 1);

		let instances = this.instances;

		instances.sort((a: Instance, b: Instance) => {
			return a.order > b.order ? 1 : -1;
		});

		instances.forEach((i, index) => {
			i.order = index;
		});

		this.instances = instances;

		rmSync(`${Storage.resourcesPath}/Storage/instances/${uuid}`, { recursive: true, force: true });

		this.saveInstances();
	}

	static updateInstance(uuid: string, instance: Instance): void {
		let index = this.instances.findIndex((i) => i.uuid == uuid);
		this.instances[index] = instance;
		this.saveInstances();
	}

	static getInstance(uuid: string): Instance {
		return this.instances.find((i) => i.uuid == uuid);
	}

	static getInstances(): Array<any> {
		let instances = this.instances;

		instances.sort((a: Instance, b: Instance) => {
			return a.order < b.order ? 1 : -1;
		});

		return instances;
	}

	static front_order(uuid: string) {
		let instances = InstanceManager.instances;

		instances.sort((a: Instance, b: Instance) => {
			return a.order < b.order ? 1 : -1;
		});

		instances.forEach((instance, index) => {
			instance.order = index + 1;
		});

		instances.find((i) => i.uuid == uuid).order = 0;

		instances.sort((a: Instance, b: Instance) => {
			return a.order < b.order ? 1 : -1;
		});

		instances.forEach((instance, index) => {
			instance.order = index;
		});

		InstanceManager.instances = instances.reverse();
		InstanceManager.saveInstances();
	}
}
