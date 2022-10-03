"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instance = void 0;
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
class Instance {
    constructor(type, version, dir) {
        this.type = "";
        this.version = "";
        this.mc_dir = "";
        this.natives_dir = ".";
        this.libraries = [];
        this.asset_index = "";
        this.assets_dir = "";
        this.java_version = 0;
        this.main_class = "";
        this.version_json = {};
        this.java_args = "";
        this.mc_args = "";
        this.version_type = "release";
        this.type = type;
        this.version = version;
        this.mc_dir = path_1.default.resolve(dir);
    }
    static create(type, version, dir) {
        return __awaiter(this, void 0, void 0, function* () {
            let instance = new Instance(type, version, dir);
            yield instance.download_version_info();
            yield instance.init_data();
            return instance;
        });
    }
    download_version_info() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Downloading version information");
            let manifest = JSON.parse(fs_1.default.readFileSync(__dirname + "/../../../../Storage/version_manifest_v2.json").toString());
            let version = manifest.versions.find((v) => v.id == this.version);
            if (version) {
                let res = yield (0, node_fetch_1.default)(version.url);
                let versionJson = yield res.json();
                this.version_json = versionJson;
                this.asset_index = this.version_json.assetIndex.id;
                this.java_version = this.version_json.javaVersion.majorVersion;
                this.main_class = this.version_json.mainClass;
                this.version_type = this.version_json.type;
                yield this.download_assets();
            }
        });
    }
    download_asset_index(id, url, location) {
        console.log("Downloading Asset Index: " + url);
        return new Promise((resolve, reject) => {
            https_1.default.get(url, (res) => {
                fs_1.default.mkdirSync(location, { recursive: true });
                const dlpath = location + "/" + id + ".json";
                const filePath = fs_1.default.createWriteStream(dlpath);
                res.pipe(filePath);
                filePath.on("finish", () => __awaiter(this, void 0, void 0, function* () {
                    filePath.close();
                    console.log("Download Completed");
                    let file = fs_1.default.readFileSync(dlpath);
                    let json = JSON.parse(file.toString());
                    resolve(json);
                }));
            });
        });
    }
    download_assets() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Downloading Assets");
            let assets_dir = __dirname + "/../../../../Storage/assets/";
            this.assets_dir = path_1.default.resolve(assets_dir);
            let assetIndex = yield this.download_asset_index(this.version_json.assetIndex.id, this.version_json.assetIndex.url, assets_dir + "indexes/");
            if (!assetIndex.objects) {
                return;
            }
            for (let key of Object.keys(assetIndex.objects)) {
                let obj = assetIndex.objects[key];
                let hash = obj.hash;
                if (!fs_1.default.existsSync(assets_dir + "objects/" + hash.substring(0, 2) + "/" + hash)) {
                    yield this.download_asset(hash, assets_dir + "objects/");
                }
            }
        });
    }
    download_asset(hash, assets_dir) {
        console.log("Downloading Asset: " + hash);
        return new Promise((resolve, reject) => {
            https_1.default.get("https://resources.download.minecraft.net/" + hash.substring(0, 2) + "/" + hash, (res) => {
                fs_1.default.mkdirSync(assets_dir + "/" + hash.substring(0, 2), { recursive: true });
                const dlpath = assets_dir + "/" + hash.substring(0, 2) + "/" + hash;
                const filePath = fs_1.default.createWriteStream(dlpath);
                res.pipe(filePath);
                filePath.on("finish", () => {
                    filePath.close();
                    console.log("Download Completed");
                    resolve(true);
                });
            });
        });
    }
    init_data() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Init Data");
            if (this.version_json.downloads && this.version_json.downloads.client && this.version_json.downloads.client.url) {
                if (!fs_1.default.existsSync(__dirname + "/../../../../Storage/versions/" + this.version + "/" + this.version + ".jar")) {
                    yield this.download_client();
                }
            }
            if (this.version_json.libraries) {
                for (let lib of this.version_json.libraries) {
                    if (!this.useLibrary(lib)) {
                        continue;
                    }
                    let jarFile = "";
                    let [libDomain, libName, libVersion, libNative] = lib.name.split(":");
                    let jarPath = path_1.default.join(...libDomain.split("."), libName, libVersion);
                    if (libNative == undefined) {
                        let native = this.getNativesString(lib);
                        jarFile = libName + "-" + libVersion + ".jar";
                        if (native != "") {
                            jarFile = libName + "-" + libVersion + "-" + native + ".jar";
                        }
                    }
                    else {
                        jarFile = libName + "-" + libVersion + "-" + libNative + ".jar";
                    }
                    let library = {
                        name: lib.name,
                        path: jarPath,
                        file: jarFile,
                    };
                    this.libraries.push(library);
                    if (!fs_1.default.existsSync(__dirname + "/../../../../Storage/libraries/" + jarPath + "/" + jarFile)) {
                        yield this.download_library(lib.downloads.artifact.url, jarPath, jarFile);
                    }
                }
            }
        });
    }
    download_library(url, path, file) {
        console.log("Downloading Library: " + file);
        return new Promise((resolve, reject) => {
            https_1.default.get(url, (res) => {
                fs_1.default.mkdirSync(__dirname + "/../../../../Storage/libraries/" + path, { recursive: true });
                const dlpath = __dirname + "/../../../../Storage/libraries/" + path + "/" + file;
                const filePath = fs_1.default.createWriteStream(dlpath);
                res.pipe(filePath);
                filePath.on("finish", () => {
                    filePath.close();
                    console.log("Download Completed");
                    resolve(true);
                });
            });
        });
    }
    getNativesString(library) {
        let arch;
        if (process.arch == "x64") {
            arch = "64";
        }
        else if (process.arch.toString() == "x32") {
            arch = "32";
        }
        else {
            console.error("Unsupported platform");
            process.exit(0);
        }
        let nativesStr = "";
        let usingNatives = false;
        let osrule;
        if (library.rules) {
            library.rules.forEach((rule) => {
                if (rule.action == "allow") {
                    if (rule.os) {
                        usingNatives = true;
                        osrule = rule;
                    }
                }
            });
        }
        if (!usingNatives) {
            return nativesStr;
        }
        let process_opsys = process.platform.toString();
        let opsys = "";
        if (process_opsys == "darwin") {
            opsys = "MacOS";
        }
        else if (process_opsys == "win32" || process_opsys == "win64") {
            opsys = "Windows";
        }
        else if (process_opsys == "linux") {
            opsys = "Linux";
        }
        if (library["natives"]) {
            if ("windows" in library["natives"] && opsys == "Windows") {
                nativesStr = library["natives"]["windows"].replace("${arch}", arch);
            }
            else if ("osx" in library["natives"] && opsys == "MacOS") {
                nativesStr = library["natives"]["osx"].replace("${arch}", arch);
            }
            else if ("linux" in library["natives"] && opsys == "Linux") {
                nativesStr = library["natives"]["linux"].replace("${arch}", arch);
            }
            else {
                console.error("Unsupported platform");
                process.exit(0);
            }
        }
        else if (osrule) {
            nativesStr = osrule.os.name;
            if (arch != "64") {
                nativesStr += "-" + osrule.os.arch;
            }
        }
        return nativesStr;
    }
    useLibrary(lib) {
        if (!("rules" in lib)) {
            return true;
        }
        for (let rule in lib.rules) {
            if (this.ruleAllows(lib.rules[rule])) {
                return true;
            }
        }
        return false;
    }
    ruleAllows(rule) {
        let useLib;
        if (rule["action"] == "allow") {
            useLib = false;
        }
        else {
            useLib = true;
        }
        let process_opsys = process.platform.toString();
        let opsys = "";
        if (process_opsys == "darwin") {
            opsys = "MacOS";
        }
        else if (process_opsys == "win32" || process_opsys == "win64") {
            opsys = "Windows";
        }
        else if (process_opsys == "linux") {
            opsys = "Linux";
        }
        if (rule["os"]) {
            if (rule["os"]["name"]) {
                let value = rule["os"]["name"];
                if (value == "windows" && opsys != "Windows") {
                    return useLib;
                }
                else if (value == "osx" && opsys != "MacOS") {
                    return useLib;
                }
                else if (value == "linux" && opsys != "Linux") {
                    return useLib;
                }
            }
            if (rule["os"]["arch"]) {
                if (rule["os"]["arch"] == "x86" && process.arch.toString() != "x32") {
                    return useLib;
                }
            }
        }
        return !useLib;
    }
    download_client() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                https_1.default.get(this.version_json.downloads.client.url, (res) => {
                    fs_1.default.mkdirSync(__dirname + "/../../../../Storage/versions/" + this.version, { recursive: true });
                    const path = __dirname + "/../../../../Storage/versions/" + this.version + "/" + this.version + ".jar";
                    const filePath = fs_1.default.createWriteStream(path);
                    res.pipe(filePath);
                    filePath.on("finish", () => {
                        filePath.close();
                        console.log("Download Completed");
                        resolve();
                    });
                });
            });
        });
    }
    get_classpath() {
        let base = path_1.default.resolve(__dirname + "/../../../../Storage/libraries/");
        let classpath = "";
        this.libraries.forEach((lib) => {
            classpath += path_1.default.join(base, lib.path, lib.file) + ";";
        });
        classpath += path_1.default.resolve(__dirname + "/../../../../Storage/versions/" + this.version + "/" + this.version + ".jar");
        return classpath;
    }
}
exports.Instance = Instance;
