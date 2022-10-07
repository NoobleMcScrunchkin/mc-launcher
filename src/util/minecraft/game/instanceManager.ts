import { Instance } from "./instance";
import https from "https";
import { existsSync, readFileSync, mkdirSync, writeFileSync, createWriteStream } from "fs";
import { Storage } from "../../storage";

export class InstanceManager {
	static instances: Array<Instance> = [];
	static instances_path: string = Storage.resourcesPath + "/Storage/instances/";
	static json_path: string = this.instances_path + "/instances.json";

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
		if (existsSync(this.json_path)) {
			let json = JSON.parse(readFileSync(this.json_path).toString());
			json.forEach((instance: any) => {
				if (!this.instances.find((i) => i.uuid == instance.uuid)) {
					this.instances.push(Object.setPrototypeOf(instance, Instance.prototype));
				}
			});
		}
		this.saveInstances();
	}

	static saveInstances(): void {
		let json = JSON.stringify(this.instances);
		mkdirSync(this.instances_path, { recursive: true });
		writeFileSync(this.json_path, json);
	}

	static async createInstance(name: string, type: "vanilla" | "fabric" | "forge", version: string): Promise<Instance> {
		let instance = await Instance.create(name, type, version);
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
		return this.instances.map((i) => {
			return {
				name: i.name,
				uuid: i.uuid,
				type: i.type,
				version: i.version,
			};
		});
	}
}
