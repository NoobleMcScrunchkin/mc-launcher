import { exec } from "child_process";
import { Instance } from "./instance";
import { User } from "../auth/user";
import { UserManager } from "../auth/userManager";
import { existsSync, mkdirSync } from "fs";
import { Storage } from "../../storage";
import { Settings } from "../../settings";
import path from "path";

export async function startGame(instance: Instance, started_callback: () => void = () => {}, stdout_callback: (data: string) => void = (data) => {}, exit_callback: () => void = () => {}, error_callback: (e: string) => void = () => {}): Promise<void> {
	let user: User = UserManager.currentUser;

	try {
		await user.update_tokens();
	} catch (e) {
		throw e;
	}

	let jvm_args = instance.get_jvm_args();
	let mc_args = instance.get_mc_args();

	mkdirSync(instance.mc_dir, { recursive: true });

	let processCall = [...jvm_args, `-Xmx${instance.jvm_memory}M`, ...(instance.custom_jvm_args ? instance.custom_jvm_args.split(" ") : []), instance.main_class, ...mc_args];

	if (process.platform == "win32") {
		processCall.forEach((arg: string, index: number) => {
			processCall[index] = "'" + arg + "'";
		});
	}

	let processCallStr = processCall.join(" ");

	processCallStr = processCallStr
		.replaceAll("${auth_player_name}", user.name)
		.replaceAll("${auth_session}", user.uuid)
		.replaceAll("${version_name}", instance.version)
		.replaceAll("${game_directory}", instance.mc_dir)
		.replaceAll("${assets_root}", instance.assets_dir)
		.replaceAll("${game_assets}", instance.assets_dir)
		.replaceAll("${assets_index_name}", instance.asset_index)
		.replaceAll("${auth_uuid}", user.uuid)
		.replaceAll("${auth_access_token}", user.mc_token.access_token)
		.replaceAll("${user_properties}", "{}")
		.replaceAll("${clientid}", "")
		.replaceAll("${auth_xuid}", "")
		.replaceAll("${user_type}", "msa")
		.replaceAll("${version_type}", instance.version_type)
		.replaceAll("${natives_directory}", instance.natives_dir)
		.replaceAll("${launcher_name}", "custom-launcher")
		.replaceAll("${launcher_version}", "1.0")
		.replaceAll("${classpath}", instance.get_classpath())
		.replaceAll("${classpath_separator}", process.platform == "win32" ? ";" : ":")
		.replaceAll("${library_directory}", path.resolve(Storage.resourcesPath + "/Storage/libraries/"));

	let java_path: string;
	let ext = process.platform.toString() == "win32" ? ".exe" : "";
	if (instance.java_version <= 8) {
		java_path = Settings.get_key("java8_path") + "/java";
		if (java_path == "" || !existsSync(java_path + ext)) {
			throw "Java 8 path is invalid (Run setup in settings)";
		}
	} else {
		java_path = Settings.get_key("java17_path") + "/java";
		if (java_path == "" || !existsSync(java_path + ext)) {
			throw "Java 17 path is invalid (Run setup in settings)";
		}
	}

	const javaRuntime = exec(`${process.platform == "win32" ? "&" : ""}${java_path}${ext} ${processCallStr}`, { shell: process.platform == "win32" ? "powershell" : undefined, cwd: instance.mc_dir }, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
			var lines = error.message.split("\n");
			lines.splice(0, 1);
			error_callback(lines.join("\n"));
			return;
		}
		// if (stderr) {
		// 	console.log(`stderr: ${stderr}`);
		// 	return;
		// }
	});

	javaRuntime.stdout.on("data", function (msg) {
		// process.stdout.write(msg);
		stdout_callback(msg);
	});

	javaRuntime.stderr.on("data", function (msg) {
		// process.stdout.write(msg);
		stdout_callback(msg);
	});

	javaRuntime.on("close", exit_callback);

	started_callback();
}
