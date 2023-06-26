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
exports.TypescriptDependency = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../abstract/code-deployment");
const typescript_deployment_1 = require("../abstract/typescript-deployment");
class TypescriptDependency extends typescript_deployment_1.TypescriptDeployment {
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
                const name = data.dependency || data.install || data.uninstall;
                const action = data.install ? 'install' : 'uninstall';
                const type = data.type === '--save-dev' || data.type === '-D' ? '--save-dev' : (data.type === '--save-peer' ? '--save-peer' : '--save-prod');
                const has = project.hasDependency(name, type);
                if (action === 'install') {
                    if (!has) {
                        if (options.onlyTest) {
                            if (options.echo) {
                                node_utils_1.Terminal.fail(`Falta la dependència ${chalk_1.default.bold(name)}.`);
                            }
                            resolve(false);
                        }
                        else {
                            if (options.echo) {
                                node_utils_1.Terminal.success(`Instal·lant dependència ${chalk_1.default.bold(name)}...`);
                            }
                            yield project.install([`npm ${action} ${name} ${type}`]);
                            resolve(true);
                        }
                    }
                    else {
                        if (options.echo) {
                            node_utils_1.Terminal.success(`Dependència instal·lada ${chalk_1.default.bold(name)}.`);
                        }
                        resolve(true);
                    }
                }
                else if (action === 'uninstall') {
                    node_utils_1.Terminal.error(`Not implemented ${chalk_1.default.bold('uninstall')} action for ${chalk_1.default.bold('TypescriptDependency')}`);
                }
            }));
        });
    }
}
exports.TypescriptDependency = TypescriptDependency;
//# sourceMappingURL=typescript-dependency.js.map