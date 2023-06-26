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
exports.FileExists = void 0;
const path_1 = __importDefault(require("path"));
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../abstract/code-deployment");
class FileExists extends code_deployment_1.CodeDeployment {
    constructor(data, project, options) {
        super(data, project, options);
    }
    deploy(project, options, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                options = code_deployment_1.CodeDeployment.extendOptions(options || this.options);
                if (!project) {
                    project = this.project;
                }
                if (!data) {
                    data = this.data;
                }
                const fullName = data.fileName;
                const relativeTo = data.relativeTo || project.projectPath || '';
                const fileName = path_1.default.relative(relativeTo, fullName);
                const help = data.help;
                if (!node_utils_1.Resource.isAccessible(fullName)) {
                    if (options.echo) {
                        node_utils_1.Terminal.fail(`Falta l'arxiu ${node_utils_1.Terminal.file(fileName, relativeTo)}.`);
                    }
                    if (help) {
                        node_utils_1.Terminal.log(help);
                    }
                    resolve(false);
                }
                else {
                    if (options.echo) {
                        node_utils_1.Terminal.success(`Existeix l'arxiu ${node_utils_1.Terminal.file(fileName, relativeTo)}.`);
                    }
                    resolve(true);
                }
            }));
        });
    }
}
exports.FileExists = FileExists;
//# sourceMappingURL=file-exists.js.map