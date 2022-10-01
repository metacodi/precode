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
exports.AngularProject = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_utils_1 = require("@metacodi/node-utils");
const typescript_project_1 = require("./typescript-project");
class AngularProject extends typescript_project_1.TypescriptProject {
    constructor(folder) { super(folder); }
    static isProjectFolder(folder) {
        const resources = node_utils_1.Resource.discover(folder);
        return typescript_project_1.TypescriptProject.isProjectFolder(folder)
            && !!resources.find(d => d.name === 'tsconfig.json')
            && !!resources.find(d => d.name === 'angular.json');
    }
    static createProject(folder) {
    }
    initialize() {
        const _super = Object.create(null, {
            initialize: { get: () => super.initialize }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    _super.initialize.call(this).then(value => {
                        if (!typescript_project_1.TypescriptProject.isProjectFolder(this.projectPath)) {
                            node_utils_1.Terminal.error(`La carpeta ${node_utils_1.Terminal.file(this.projectPath)} no és d'un projecte ${chalk_1.default.bold('angular typescript')}`);
                        }
                        node_utils_1.Terminal.verbose(`Carregant arxiu ${node_utils_1.Terminal.file(chalk_1.default.bold('angular.json'))} de configuració...`);
                        this.angular = node_utils_1.Resource.open(this.rootPath('angular.json'));
                        resolve(true);
                    }).catch(error => reject(error));
                }
                catch (error) {
                    node_utils_1.Terminal.error(error);
                    reject(error);
                }
            });
        });
    }
    getNgModuleProperty(classe, propName, throwError = true) {
        const deco = classe.decorators.find(d => d.expression.expression.text === 'NgModule');
        if (!deco) {
            if (throwError) {
                node_utils_1.Terminal.error(`No s'ha trobat el decorador de classe '${chalk_1.default.bold('@NgModule')}'.`, false);
            }
            return undefined;
        }
        const obj = deco.expression.arguments[0];
        const prop = obj.properties.find((p) => p.name.getText() === propName);
        if (!prop) {
            if (throwError) {
                node_utils_1.Terminal.error(`No s'ha trobat la propietat '${chalk_1.default.bold(propName)}' al decorador de classe '${chalk_1.default.bold('@NgModule')}'.`, false);
            }
            return undefined;
        }
        return prop;
    }
}
exports.AngularProject = AngularProject;
//# sourceMappingURL=angular-project.js.map