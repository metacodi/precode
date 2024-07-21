"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.IonicAngularProject = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const node_utils_1 = require("@metacodi/node-utils");
const code_project_1 = require("./code-project");
const angular_project_1 = require("./angular-project");
const generate_1 = require("./resources/generate/generate");
class IonicAngularProject extends angular_project_1.AngularProject {
    static isProjectFolder(folder) {
        const resources = node_utils_1.Resource.discover(folder);
        return angular_project_1.AngularProject.isProjectFolder(folder)
            && !!resources.find(d => d.name === 'tsconfig.json')
            && !!resources.find(d => d.name === 'angular.json')
            && !!resources.find(d => d.name === 'ionic.config.json');
    }
    static createProject(folder) {
        const projectName = path.basename(folder);
        code_project_1.CodeProject.install(folder, [`ionic start ${projectName}`]);
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
                        if (!angular_project_1.AngularProject.isProjectFolder(this.projectPath)) {
                            node_utils_1.Terminal.error(`La carpeta ${node_utils_1.Terminal.file(this.projectPath)} no és d'un projecte ${chalk_1.default.bold('ionic angular')}`);
                        }
                        node_utils_1.Terminal.verbose(`Carregant arxiu ${node_utils_1.Terminal.file(chalk_1.default.bold('ionic.config.json'))} de configuració...`);
                        this.ionic = node_utils_1.Resource.open(this.rootPath('ionic.config.json'));
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
    sanitizeEntity(entity) {
        return entity.split('-').map(s => (0, node_utils_1.capitalize)(s)).join('');
    }
    generateSchema(folder, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${folder}/${entity.plural}.schema`;
            yield this.folder(folder);
            yield this.file(`${fileName}.ts`, { content: generate_1.schemaContent, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                    { match: '{{entityName}}', replace: entity.plural.substring(0, entity.plural.length - 1) === entity.singular
                            ? `'${entity.plural}'`
                            : `{ singular: '${entity.singular}', plural: '${entity.plural}' }`
                    },
                ] });
        });
    }
    generateService(folder, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${folder}/${entity.plural}.service.ts`;
            yield this.folder(folder);
            yield this.file(fileName, { content: generate_1.serviceContent, replaces: [
                    { match: '{{entityPlural}}', replace: this.sanitizeEntity(entity.plural) }
                ] });
        });
    }
    generateModule(folder, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${folder}/${entity.plural}.module.ts`;
            yield this.folder(folder);
            yield this.file(fileName, { content: generate_1.moduleContent, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                    { match: '{{entityPlural}}', replace: entity.plural },
                    { match: '{{EntitySingular}}', replace: this.sanitizeEntity(entity.singular) },
                    { match: '{{entitySingular}}', replace: entity.singular },
                ] });
        });
    }
    generateListPage(folder, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${folder}/${entity.plural}-list.page`;
            yield this.folder(folder);
            yield this.file(`${fileName}.ts`, { content: generate_1.listPageTsContent, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                    { match: '{{entityPlural}}', replace: entity.plural },
                ] });
            yield this.file(`${fileName}.scss`);
            yield this.file(`${fileName}.html`, { content: generate_1.listPageHtmlContent, replaces: [
                    { match: '{{entityPlural}}', replace: entity.plural },
                ] });
        });
    }
    generateListComponent(folder, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${folder}/${entity.plural}-list.component`;
            yield this.folder(folder);
            yield this.file(`${fileName}.ts`, { content: generate_1.listComponentTs, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                    { match: '{{entityPlural}}', replace: entity.plural },
                ] });
            yield this.file(`${fileName}.scss`, { content: generate_1.listComponentScss });
            yield this.file(`${fileName}.html`, { content: generate_1.listComponentHtml, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                ] });
        });
    }
    generateDetailPage(folder, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${folder}/${entity.singular}-detail.page`;
            yield this.folder(folder);
            yield this.file(`${fileName}.ts`, { content: generate_1.detailPageTs, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                    { match: '{{entityPlural}}', replace: entity.plural },
                    { match: '{{EntitySingular}}', replace: this.sanitizeEntity(entity.singular) },
                    { match: '{{entitySingular}}', replace: entity.singular },
                ] });
            yield this.file(`${fileName}.scss`);
            yield this.file(`${fileName}.html`, { content: generate_1.detailPageHtml, replaces: [
                    { match: '{{EntityPlural}}', replace: this.sanitizeEntity(entity.plural) },
                    { match: '{{entityPlural}}', replace: entity.plural },
                ] });
        });
    }
}
exports.IonicAngularProject = IonicAngularProject;
//# sourceMappingURL=ionic-angular-project.js.map