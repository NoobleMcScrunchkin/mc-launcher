import { exec } from "child_process";
import { Instance } from "./instance";
import { User } from "../auth/user";

export function startGame(instance: Instance, user: User): void {
	let processCall = [
		"java",
		instance.java_args,
		`-Djava.library.path=${instance.natives_dir}`,
		"-Dminecraft.launcher.brand=custom-launcher",
		"-Dminecraft.launcher.version=1.0",
		"-cp",
		instance.get_classpath(),
		instance.main_class,
		"--username",
		user.name,
		"--version",
		instance.version,
		"--gameDir",
		instance.mc_dir,
		"--assetsDir",
		instance.assets_dir,
		"--assetIndex",
		instance.asset_index,
		"--uuid",
		user.uuid,
		"--accessToken",
		user.mc_token.access_token,
		"--versionType",
		"release",
		instance.mc_args,
	];

	const javaRuntime = exec(processCall.join(" "), function (error, stdout, stderr) {
		if (error) {
			console.log(error.stack);
			console.log("Error code: " + error.code);
			console.log("Signal received: " + error.signal);
		}
		console.log(stdout);
		console.log(stderr);
	});
}
