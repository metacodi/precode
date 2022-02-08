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
exports.ApiPhpProject = void 0;
const chalk_1 = __importDefault(require("chalk"));
const terminal_1 = require("../utils/terminal");
const resource_1 = require("../utils/resource");
const php_project_1 = require("./php-project");
class ApiPhpProject extends php_project_1.PhpProject {
    static isProjectFolder(folder) {
        const resources = resource_1.Resource.discover(folder);
        return !!resources.find(d => d.name === 'api.php')
            && !!resources.find(d => d.name === 'api.json')
            && !!resources.find(d => d.name === 'rest.php');
    }
    static createProject(folder) {
    }
    constructor(folder) { super(folder); }
    initialize() {
        const _super = Object.create(null, {
            initialize: { get: () => super.initialize }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    _super.initialize.call(this).then(value => {
                        if (!php_project_1.PhpProject.isProjectFolder(this.projectPath)) {
                            terminal_1.Terminal.error(`La carpeta ${terminal_1.Terminal.file(this.projectPath)} no és d'un projecte ${chalk_1.default.bold('api php')}`);
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
}
exports.ApiPhpProject = ApiPhpProject;
//# sourceMappingURL=api-php-project.js.map