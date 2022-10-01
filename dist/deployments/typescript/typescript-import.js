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
exports.TypescriptImport = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../abstract/code-deployment");
const typescript_deployment_1 = require("../abstract/typescript-deployment");
class TypescriptImport extends typescript_deployment_1.TypescriptDeployment {
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
                const file = project.getSourceFile(data.file.fileName);
                const specifier = data.specifier || data.import;
                const from = data.from;
                const imports = project.getImports(file);
                const fileName = path_1.default.relative(project.projectPath, file.fileName);
                if (!imports.find(i => i.from === `'${from}'` && i.imports.includes(specifier))) {
                    if (options.onlyTest) {
                        if (options.echo) {
                            node_utils_1.Terminal.fail(`Falta importació ${chalk_1.default.bold(specifier)} a l'arxiu ${node_utils_1.Terminal.file(fileName)}.`);
                        }
                        resolve(false);
                    }
                    else {
                        if (options.echo) {
                            node_utils_1.Terminal.success(`Instal·lant importació ${chalk_1.default.bold(specifier)} a l'arxiu ${node_utils_1.Terminal.file(fileName)}.`);
                        }
                        const content = project.fileImports(file.fileName, [{ import: specifier, from }]);
                        resolve(node_utils_1.Resource.save(file.fileName, content));
                    }
                }
                else {
                    if (options.verbose) {
                        node_utils_1.Terminal.success(`Importació correcta de ${chalk_1.default.bold(specifier)} a l'arxiu ${node_utils_1.Terminal.file(fileName)}.`);
                    }
                    resolve(true);
                }
            }));
        });
    }
}
exports.TypescriptImport = TypescriptImport;
//# sourceMappingURL=typescript-import.js.map