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
exports.AngularNgModule = void 0;
const chalk_1 = __importDefault(require("chalk"));
const code_deployment_1 = require("../abstract/code-deployment");
const resource_1 = require("../../utils/resource");
const terminal_1 = require("../../utils/terminal");
const angular_deployment_1 = require("../abstract/angular-deployment");
const text_replacer_1 = require("../../utils/text-replacer");
class AngularNgModule extends angular_deployment_1.AngularDeployment {
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
                const ngModule = data.ngModule;
                const property = data.property;
                const element = data.element;
                const text = data.text || data.element;
                const test = data.test;
                const classe = project.findClassDeclaration(ngModule, file.statements);
                const prop = project.getNgModuleProperty(classe, property);
                const value = prop.initializer;
                if (!value.elements.find(e => test(e))) {
                    if (options.onlyTest) {
                        if (options.echo) {
                            terminal_1.Terminal.fail(`Falta la importació ${chalk_1.default.bold(element)} al decorador ${chalk_1.default.bold('@NgModule')}.`);
                        }
                        resolve(false);
                    }
                    else {
                        if (options.echo) {
                            terminal_1.Terminal.success(`Afegint la importació ${chalk_1.default.bold(element)} al decorador ${chalk_1.default.bold('@NgModule')}...`);
                        }
                        const pos = value.end - 1;
                        const comma = value.getText() === '[]' ? '' : ', ';
                        const content = resource_1.Resource.open(file.fileName);
                        const replacer = new text_replacer_1.TextReplacer(content);
                        replacer.insert(pos, `${comma}${text}`);
                        resolve(resource_1.Resource.save(file.fileName, replacer.apply()));
                    }
                }
                else {
                    if (options.echo) {
                        terminal_1.Terminal.success(`Importació correcta de ${chalk_1.default.bold(element)} al decorador ${chalk_1.default.bold('@NgModule')}.`);
                    }
                    resolve(true);
                }
            }));
        });
    }
}
exports.AngularNgModule = AngularNgModule;
//# sourceMappingURL=ngModule.js.map