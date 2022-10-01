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
exports.TypescriptConstructor = void 0;
const chalk_1 = __importDefault(require("chalk"));
const typescript_1 = __importDefault(require("typescript"));
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../abstract/code-deployment");
const typescript_deployment_1 = require("../abstract/typescript-deployment");
const typescript_parser_1 = require("../../parsers/typescript-parser");
const text_replacer_1 = require("../../utils/text-replacer");
class TypescriptConstructor extends typescript_deployment_1.TypescriptDeployment {
    constructor(data, project, options) {
        super(data, project, options);
    }
    deploy(project, options, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                options = code_deployment_1.CodeDeployment.extendOptions(options || this.options);
                if (!project) {
                    project = this.project;
                }
                if (!data) {
                    data = this.data;
                }
                const file = project.getSourceFile(data.file.fileName);
                const classe = data.class
                    ? project.findClassDeclaration(data.class, file)
                    : typescript_parser_1.TypescriptParser.find(file.statements, typescript_1.default.SyntaxKind.ClassDeclaration, { recursive: true });
                const method = typescript_parser_1.TypescriptParser.find(classe, typescript_1.default.SyntaxKind.Constructor, { recursive: true });
                if (!method) {
                    node_utils_1.Terminal.error(`No s'ha trobat el constructor de la classe '${chalk_1.default.bold((_a = classe === null || classe === void 0 ? void 0 : classe.name) === null || _a === void 0 ? void 0 : _a.text)}'.`, false);
                    return undefined;
                }
                const identifier = data.identifier;
                const modifier = data.modifier || 'public';
                const type = data.type;
                if (!method.parameters.find(p => { var _a, _b; return ((_b = (_a = p.type) === null || _a === void 0 ? void 0 : _a.typeName) === null || _b === void 0 ? void 0 : _b.escapedText) === type; })) {
                    if (options.onlyTest) {
                        if (options.echo) {
                            node_utils_1.Terminal.fail(`Falta ${chalk_1.default.bold(type)} al constructor de la classe ${chalk_1.default.bold(classe.name.text)}.`);
                        }
                        resolve(false);
                    }
                    else {
                        if (options.echo) {
                            node_utils_1.Terminal.success(`Afegint ${chalk_1.default.bold(type)} al constructor de la classe ${chalk_1.default.bold(classe.name.text)}.`);
                        }
                        const pos = method.parameters.pos;
                        const content = node_utils_1.Resource.open(file.fileName);
                        const replacer = new text_replacer_1.TextReplacer(content);
                        if (method.parameters.length) {
                            const params = method.parameters.map(p => '\n    ' + p.getText());
                            params.push(`\n    ${modifier} ${identifier}: ${type},`);
                            replacer.replaceNode(method.parameters, params.join());
                        }
                        else {
                            replacer.insert(pos, `\n    ${modifier} ${identifier}: ${type},\n  `);
                        }
                        resolve(node_utils_1.Resource.save(file.fileName, replacer.apply()));
                    }
                }
                else {
                    if (options.echo) {
                        node_utils_1.Terminal.success(`Paràmetre ${chalk_1.default.bold(type)} al constructor de la classe ${chalk_1.default.bold(classe.name.text)}.`);
                    }
                    resolve(true);
                }
            }));
        });
    }
}
exports.TypescriptConstructor = TypescriptConstructor;
//# sourceMappingURL=typescript-constructor.js.map