"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGame = void 0;
const child_process_1 = require("child_process");
function startGame(instance, user) {
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
    const javaRuntime = (0, child_process_1.exec)(processCall.join(" "), function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log("Error code: " + error.code);
            console.log("Signal received: " + error.signal);
        }
        console.log(stdout);
        console.log(stderr);
    });
}
exports.startGame = startGame;
