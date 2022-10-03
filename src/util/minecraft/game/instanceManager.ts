import { Instance } from "./instance";
import { app } from "electron";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";

export class InstanceManager {
	static instances: Array<Instance> = [];
	static instances_path: string = app.getAppPath() + "/Storage/instances/";
	static json_path: string = this.instances_path + "/instances.json";

	static loadInstances() {
		if (existsSync(this.json_path)) {
			let json = JSON.parse(readFileSync(this.json_path).toString());
			json.forEach((instance: any) => {
				this.instances.push(Object.setPrototypeOf(instance, Instance.prototype));
			});
		} else {
			this.saveInstances();
		}
	}

	static saveInstances() {
		let json = JSON.stringify(this.instances);
		mkdirSync(this.instances_path, { recursive: true });
		writeFileSync(this.json_path, json);
	}

	static async createInstance(type: "vanilla" | "fabric" | "forge", version: string): Promise<Instance> {
		let instance = await Instance.create(type, version);
		this.addInstance(instance);
		return instance;
	}

	static addInstance(instance: Instance) {
		this.instances.push(instance);
		this.saveInstances();
	}

	static removeInstance(uuid: string) {
		let index = this.instances.findIndex((i) => i.uuid == uuid);
		this.instances.splice(index, 1);
		this.saveInstances();
	}

	static updateInstance(uuid: string, instance: Instance) {
		let index = this.instances.findIndex((i) => i.uuid == uuid);
		this.instances[index] = instance;
		this.saveInstances();
	}

	static getInstance(uuid: string): Instance {
		return this.instances.find((i) => i.uuid == uuid);
	}

	static getInstances(): Array<Instance> {
		return this.instances;
	}
}
