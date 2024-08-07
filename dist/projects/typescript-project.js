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
exports.TypescriptProject = void 0;
const code_project_1 = require("./code-project");
const chalk_1 = __importDefault(require("chalk"));
const typescript_1 = __importDefault(require("typescript"));
const fs = __importStar(require("fs"));
const node_utils_1 = require("@metacodi/node-utils");
const text_replacer_1 = require("../utils/text-replacer");
const typescript_parser_1 = require("../parsers/typescript-parser");
class TypescriptProject extends code_project_1.CodeProject {
    static isProjectFolder(folder) {
        const resources = node_utils_1.Resource.discover(folder);
        return !!resources.find(d => d.name === 'tsconfig.json');
    }
    static createProject(folder) {
        code_project_1.CodeProject.install(folder, ['tsc --init']);
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
                        if (!TypescriptProject.isProjectFolder(this.projectPath)) {
                            node_utils_1.Terminal.error(`La carpeta ${node_utils_1.Terminal.file(this.projectPath)} no és d'un projecte ${chalk_1.default.bold('typescript')}`);
                        }
                        node_utils_1.Terminal.verbose(`Carregant arxiu ${node_utils_1.Terminal.file(chalk_1.default.bold('tsconfig.json'))} de configuració...`);
                        this.tsconfig = node_utils_1.Resource.open(this.rootPath('tsconfig.json'));
                        node_utils_1.Terminal.verbose(`Carregant arxiu ${node_utils_1.Terminal.file(chalk_1.default.bold('package.json'))} de configuració...`);
                        this.package = node_utils_1.Resource.open(this.rootPath('package.json'));
                        this.name = this.package && this.package.name ? this.package.name : '';
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
    incrementPackageVersion() {
        const pkg = node_utils_1.Resource.open('package.json');
        const version = pkg.version.split('.');
        version[2] = `${+version[2] + 1}`;
        pkg.version = version.join('.');
        node_utils_1.Terminal.log('Incremented ' + chalk_1.default.bold('package.json') + ' patch version to:', node_utils_1.Terminal.green(pkg.version));
        node_utils_1.Resource.save('package.json', pkg);
    }
    hasDependency(name, type) {
        if (this.package && typeof this.package.dependencies === 'object') {
            return Object.keys(this.package[type === '--save-prod' ? 'dependencies' : (type === '--save-peer' ? 'peerDependencies' : 'devDependencies')]).includes(name);
        }
    }
    isCapacitorElectron() {
        const resources = node_utils_1.Resource.discover(this.projectPath);
        return !!resources.find(r => r.isDirectory && r.name === 'electron');
    }
    isCapacitoriOS() {
        return this.hasDependency('@capacitor/ios', '--save-prod');
    }
    isCapacitorAndroid() {
        return this.hasDependency('@capacitor/android', '--save-prod');
    }
    fileImports(fileName, imports, fileContent) {
        const fullName = this.rootPath(fileName);
        if (!fs.existsSync(fullName)) {
            node_utils_1.Terminal.error(`No existeix l'arxiu ${node_utils_1.Terminal.file(fileName)}`);
            return fileContent;
        }
        if (!fileContent) {
            node_utils_1.Terminal.verbose(`Llegint arxiu ${node_utils_1.Terminal.file(fileName)}...`);
        }
        let content = fileContent || fs.readFileSync(fullName, 'utf-8').toString();
        if (imports && imports.length) {
            node_utils_1.Terminal.logInline(`Modificant importacions de l'arxiu ${node_utils_1.Terminal.file(fileName)}...`);
            const sourceFile = this.getSourceFile(fullName, content);
            const replacer = new text_replacer_1.TextReplacer(content);
            const declared = this.getImports(sourceFile);
            const lastImport = declared.length ? declared[declared.length - 1] : undefined;
            for (const i of imports) {
                const found = declared.filter((d) => d.from === `'${i.from}'`);
                if (!i.action) {
                    i.action = 'add';
                }
                if (i.action === 'add') {
                    if (found.length) {
                        const add = [];
                        if (found.filter(f => f.imports.includes(i.import)).length === 0) {
                            add.push(i.import);
                        }
                        if (add.length) {
                            node_utils_1.Terminal.success(`Afegint ${chalk_1.default.bold(add.join(', '))} a la fila existent de ${chalk_1.default.bold(i.from)}`);
                            const newImport = `\nimport \{ ${found[0].imports.concat(add).join(', ')} \} from '${i.from}';`;
                            replacer.replaceNode(found[0], newImport);
                        }
                        else {
                            node_utils_1.Terminal.verbose(`- Ja existeix la importació de ${chalk_1.default.bold(i.from)}`);
                        }
                    }
                    else {
                        node_utils_1.Terminal.success(`Afegint fila d'importació per '${chalk_1.default.bold(i.from)}'...`);
                        const newImport = `\nimport \{ ${i.import} \} from '${i.from}';`;
                        replacer.insertAfter(lastImport, newImport);
                    }
                }
                else if (i.action === 'remove') {
                    if (found.length) {
                        found.map(f => {
                            const rest = f.imports.filter((s) => !i.import.includes(s));
                            const remove = f.imports.filter((s) => i.import.includes(s));
                            if (rest.length) {
                                node_utils_1.Terminal.success(`Eliminant ${chalk_1.default.bold(remove.join(', '))} de la fila de ${chalk_1.default.bold(i.from)}`);
                                const newImport = `\nimport \{ ${rest.join(', ')} \} from '${i.from}';`;
                                replacer.replaceNode(f, newImport);
                            }
                            else {
                                node_utils_1.Terminal.success(`Eliminant importació de ${chalk_1.default.bold(i.from)}...`);
                                replacer.deleteNode(f);
                            }
                        });
                    }
                    else {
                        node_utils_1.Terminal.verbose(`- Ja no existeix la importació de ${chalk_1.default.bold(i.from)}`);
                    }
                }
                else {
                    node_utils_1.Terminal.warning(`No es reconeix el tipus d'acció '${i.action}' per la importació de ${chalk_1.default.bold(i.from)}`);
                }
            }
            content = replacer.apply();
        }
        else {
        }
        return content;
    }
    getImports(sourceFile) {
        return typescript_parser_1.TypescriptParser.filter(sourceFile.statements, typescript_1.default.SyntaxKind.ImportDeclaration, { firstOnly: false }).map((node) => ({
            imports: node.importClause.name ? [node.importClause.name] :
                node.importClause.namedBindings.elements.map((e) => e.propertyName ? e.propertyName.text : e.name.text),
            from: node.moduleSpecifier.getText(),
            pos: node.pos,
            end: node.end,
        }));
    }
    replaces(fileName, options) {
        if (options.replaces && options.replaces.length) {
            fileName = this.relativePath(fileName);
            node_utils_1.Terminal.log(`Actualitzant codi de l'arxiu '${node_utils_1.Terminal.file(fileName)}'...`);
            const sourceFile = this.getSourceFile(fileName, options.content);
            const replacer = new text_replacer_1.TextReplacer(options.content);
            for (const action of options.replaces) {
                let descartado = false;
                if (!!action.skip) {
                    if (typeof action.skip === 'string') {
                        action.skip = new RegExp(action.skip);
                    }
                    if (action.skip.test(options.content)) {
                        descartado = true;
                        node_utils_1.Terminal.verbose(`- S'ha descartat substituir l'expressió perquè ja existeix.`);
                    }
                }
                if (!descartado) {
                    if (typeof action.replace === 'function') {
                        node_utils_1.Terminal.log(action.description ? '- ' + action.description : `- Executant funció de substitució`);
                        action.replace(sourceFile, replacer);
                        options.content = replacer.apply(options.content);
                    }
                    else {
                        if (action.global === undefined) {
                            action.global = true;
                        }
                        if (action.insensitive === undefined) {
                            action.insensitive = false;
                        }
                        const flags = [action.global ? 'g' : '', action.insensitive ? 'i' : ''].filter(s => !!s).join('');
                        node_utils_1.Terminal.log(action.description ? '- ' + action.description : `- Substituint l'expressió: ` + chalk_1.default.grey(action.match.toString()) + ' (flags:' + flags + ')');
                        options.content = options.content.replace(new RegExp(action.match, flags), action.replace || '');
                    }
                }
            }
        }
        else {
        }
        return options.content;
    }
    getSourceFile(fileName, content) {
        const fullName = this.rootPath(fileName);
        fileName = this.relativePath(fileName);
        const result = typescript_parser_1.TypescriptParser.parse(fullName, content);
        if (!result) {
            node_utils_1.Terminal.error(`No existeix l'arxiu ${node_utils_1.Terminal.file(fileName)}`);
            return undefined;
        }
        return result;
    }
    parseSourceFile(fileName, content) {
        const fullName = this.rootPath(fileName);
        fileName = this.relativePath(fileName);
        const parser = new typescript_parser_1.TypescriptParser(fileName, content);
        return parser;
    }
    findClassDeclaration(name, source, throwError = true) {
        if (typeof source === 'string') {
            source = this.getSourceFile(source);
        }
        const classe = typescript_parser_1.TypescriptParser.find(source, (node) => node.kind === typescript_1.default.SyntaxKind.ClassDeclaration && node.name.text === name);
        if (!classe && throwError) {
            node_utils_1.Terminal.error(`No s'ha trobat la classe '${chalk_1.default.bold(name)}'.`, false);
            return undefined;
        }
        return classe;
    }
    saveSourceFile(fileName, content) {
        const source = typescript_1.default.createSourceFile(node_utils_1.Resource.normalize(fileName), content, typescript_1.default.ScriptTarget.ESNext, true, typescript_1.default.ScriptKind.TS);
        const replacements = [];
        this.normalizeObjectLiteral(source, replacements);
        const replaced = this.aplyReplacements(content, replacements.reverse()).replace(/\n  (?=\w)/g, '\n\n  ');
        fs.writeFileSync(node_utils_1.Resource.normalize(fileName), replaced);
    }
    normalizeObjectLiteral(node, replacements) {
        if (typescript_1.default.isPropertyAssignment(node)) {
            const propName = node.getChildren()[0];
            const propValue = node.getChildren()[2];
            if (typescript_1.default.isStringLiteral(propName)) {
                replacements.push({ start: propName.end - propName.getText().length, end: propName.end, text: propName.text });
            }
            if (typescript_1.default.isStringLiteral(propValue)) {
                if (propValue.getText().trim().startsWith('"')) {
                    replacements.push({ start: propValue.end - propValue.getText().length, end: propValue.end, text: `'${propValue.text}'` });
                }
            }
        }
        node.forEachChild(child => this.normalizeObjectLiteral(child, replacements));
    }
    aplyReplacements(content, replacements) {
        replacements.sort((r1, r2) => r2.start - r1.start).map(r => content = content.slice(0, r.start) + r.text + content.slice(r.end));
        return content;
    }
}
exports.TypescriptProject = TypescriptProject;
//# sourceMappingURL=typescript-project.js.map