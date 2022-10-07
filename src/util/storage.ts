export class Storage {
	static resourcesPath: string = process.platform == "win32" ? process.resourcesPath : process.env["HOME"] + "/.mc-launcher";
}
