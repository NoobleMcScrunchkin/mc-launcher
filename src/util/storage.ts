export class Storage {
	static resourcesPath: string = (process.env["HOME"] != undefined ? process.env["HOME"] : process.env["HOMEPATH"]) + "/.mc-launcher";
}
