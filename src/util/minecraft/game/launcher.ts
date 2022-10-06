import { exec } from "child_process";
import { Instance } from "./instance";
import { User } from "../auth/user";
import { UserManager } from "../auth/userManager";
import { Browser } from "../../electron/browser";

export function startGame(instance: Instance): void {
	let user: User = UserManager.currentUser;

	let processCall = [
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
		"--userProperties",
		"{}",
		instance.mc_args,
	];

	processCall.forEach((arg: string, index: number) => {
		processCall[index] = "'" + arg + "'";
	});

	// console.log("& java " + processCall.join(" "));

	const javaRuntime = exec("& java " + processCall.join(" "), { shell: process.platform == "win32" ? "powershell" : undefined, cwd: instance.mc_dir }, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
			return;
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
			return;
		}
	});

	javaRuntime.stdout.on("data", function (msg) {
		process.stdout.write(msg);
		Browser.mainWindow.webContents.executeJavaScript(`console.log("${msg.replace(/(\r\n|\n|\r)/gm, "")}")`);
	});
}
