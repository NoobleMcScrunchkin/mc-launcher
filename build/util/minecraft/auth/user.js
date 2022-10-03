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
exports.User = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class User {
    constructor(ms_token, mc_token) {
        this.ms_token = {};
        this.mc_token = {};
        this.name = "";
        this.uuid = "";
        this.skins = [];
        this.capes = [];
        this.ms_token = ms_token;
        this.mc_token = mc_token;
    }
    get_user_info() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield (0, node_fetch_1.default)("https://api.minecraftservices.com/minecraft/profile", {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + this.mc_token.access_token,
                },
            });
            let json = yield res.json();
            this.name = json.name;
            this.uuid = json.id;
            this.skins = json.skins;
            this.capes = json.capes;
        });
    }
    static create(ms_token, mc_token) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = new User(ms_token, mc_token);
            yield user.get_user_info();
            return user;
        });
    }
}
exports.User = User;
