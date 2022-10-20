import { exec } from "child_process";
import { Instance } from "./instance";
import { User } from "../auth/user";
import { UserManager } from "../auth/userManager";
import { mkdirSync } from "fs";

export async function startGame(instance: Instance, started_callback: () => void = () => {}, stdout_callback: (data: string) => void = (data) => {}, exit_callback: () => void = () => {}): Promise<void> {
	let user: User = UserManager.currentUser;

	try {
		await user.update_tokens();
	} catch (e) {
		throw e;
	}

	let jvm_args = instance.get_jvm_args();
	let mc_args = instance.get_mc_args();

	mkdirSync(instance.mc_dir, { recursive: true });

	let processCall = [...jvm_args, instance.main_class, ...mc_args];

	if (process.platform == "win32") {
		processCall.forEach((arg: string, index: number) => {
			processCall[index] = "'" + arg + "'";
		});
	}

	let processCallStr = processCall.join(" ");

	processCallStr = processCallStr
		.replace("${auth_player_name}", user.name)
		.replace("${auth_session}", user.uuid)
		.replace("${version_name}", instance.version)
		.replace("${game_directory}", instance.mc_dir)
		.replace("${assets_root}", instance.assets_dir)
		.replace("${game_assets}", instance.assets_dir)
		.replace("${assets_index_name}", instance.asset_index)
		.replace("${auth_uuid}", user.uuid)
		.replace("${auth_access_token}", user.mc_token.access_token)
		.replace("${user_properties}", "{}")
		.replace("${clientid}", "")
		.replace("${auth_xuid}", "")
		.replace("${user_type}", "msa")
		.replace("${version_type}", instance.version_type)
		.replace("${natives_directory}", instance.natives_dir)
		.replace("${launcher_name}", "custom-launcher")
		.replace("${launcher_version}", "1.0")
		.replace("${classpath}", instance.get_classpath());

	let java_path: string;
	if (instance.java_version <= 8) {
		java_path = "C:\\Users\\kiera\\Desktop\\jre1.8.0_202\\bin\\java.exe";
	} else {
		java_path = "java";
	}

	const javaRuntime = exec(`${process.platform == "win32" ? "&" : ""}${java_path} ${processCallStr}`, { shell: process.platform == "win32" ? "powershell" : undefined, cwd: instance.mc_dir }, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
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
