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
exports.PhpProject = void 0;
const chalk_1 = __importDefault(require("chalk"));
const terminal_1 = require("../utils/terminal");
const resource_1 = require("../utils/resource");
const code_project_1 = require("./code-project");
const php_parser_1 = require("../parsers/php-parser");
class PhpProject extends code_project_1.CodeProject {
    static isProjectFolder(folder) {
        const resources = resource_1.Resource.discover(folder);
        return !!resources.filter(d => d.extension === '.php').length;
    }
    static createProject(folder) {
    }
    constructor(folder) { super(folder, __dirname); }
    initialize() {
        const _super = Object.create(null, {
            initialize: { get: () => super.initialize }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    _super.initialize.call(this).then(value => {
                        if (!PhpProject.isProjectFolder(this.projectPath)) {
                            terminal_1.Terminal.error(`La carpeta ${terminal_1.Terminal.file(this.projectPath)} no és d'un projecte ${chalk_1.default.bold('php')}`);
                        }
                        resolve(true);
                    }).catch(error => reject(error));
                }
                catch (error) {
                    terminal_1.Terminal.error(error);
                    reject(error);
                }
            });
        });
    }
    getSourceFile(fileName, content) {
        const fullName = this.rootPath(fileName);
        const result = php_parser_1.PhpParser.parse(fullName, content);
        if (!result) {
            terminal_1.Terminal.error(`No existeix l'arxiu ${terminal_1.Terminal.file(fileName)}`);
            return undefined;
        }
        return result;
    }
    findClassDeclaration(name, source, throwError = true) {
        const classe = php_parser_1.PhpParser.find(source, (node) => node.kind === 'class' && node.name && node.name.name === name);
        if (!classe && throwError) {
            terminal_1.Terminal.error(`No s'ha trobat la classe '${chalk_1.default.bold(name)}'.`, false);
            return undefined;
        }
        return classe;
    }
}
exports.PhpProject = PhpProject;
//# sourceMappingURL=php-project.js.map