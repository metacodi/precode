#!/usr/bin/env node
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
exports.AppApiClient = void 0;
const typescript_1 = __importDefault(require("typescript"));
const chalk_1 = __importDefault(require("chalk"));
const node_api_client_1 = require("@metacodi/node-api-client");
const node_utils_1 = require("@metacodi/node-utils");
const typescript_parser_1 = require("../parsers/typescript-parser");
class AppApiClient extends node_api_client_1.ApiClient {
    constructor(options) {
        super();
        this.options = options;
    }
    baseUrl() { return this.options.apiBaseUrl; }
    getAuthHeaders(method, endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                'Authorization': 'SERVER',
                'Authorization-User': this.options.apiIdUser,
            };
        });
    }
    request(method, endpoint, options) {
        const _super = Object.create(null, {
            request: { get: () => super.request }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            options.headers = options.headers || {};
            options.headers['Content-Type'] = 'application/json';
            return _super.request.call(this, method, endpoint, options);
        });
    }
    processSchemasFromFolder(folder, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const verbose = !!options.verbose;
            const commented = !!options.commented;
            const schemaErrors = [];
            node_utils_1.Terminal.title(chalk_1.default.bold(`Create entities types`));
            node_utils_1.Terminal.logInline('- Scanning folder...');
            const resources = node_utils_1.Resource.discover(folder, { recursive: true });
            const reduce = (res) => res.reduce((files, f) => [...files, ...(/\.schema\.ts$/.test(f.fullName) ? [f] : []), ...reduce(f.children || [])], []);
            const files = reduce(resources);
            node_utils_1.Terminal.success(`Found ${chalk_1.default.bold(files.length)} schema file(s).`);
            for (const file of files) {
                const { errors } = yield this.processSchemaFile(file, { folderRelativeTo: folder, verbose, commented });
                schemaErrors.push(...errors);
            }
            if (schemaErrors.length) {
                node_utils_1.Terminal.line();
                node_utils_1.Terminal.log(chalk_1.default.bold.red(`\nERRORS RESUME:\n`));
                schemaErrors.map(error => {
                    const { file, interfaceName, message } = error;
                    node_utils_1.Terminal.log(`${chalk_1.default.red(`x`)} ${file.fullName.substring(folder.length)}`);
                    node_utils_1.Terminal.log(`  ${chalk_1.default.bold.red(interfaceName)}: ${chalk_1.default.red(message)}\n`);
                });
            }
        });
    }
    processSchemaFile(file, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const folderRelativeTo = options.folderRelativeTo === undefined ? false : options.folderRelativeTo;
            const verbose = options.verbose === undefined ? false : options.verbose;
            const commented = options.commented === undefined ? true : options.commented;
            const logFileName = folderRelativeTo ? node_utils_1.Terminal.file(file.fullName.substring(folderRelativeTo.length)) : file.fullName;
            const interfaces = [];
            const errors = [];
            node_utils_1.Terminal.logInline(`- Parsing ${logFileName}`);
            const parser = new typescript_parser_1.TypescriptParser(file.fullName);
            const schemas = parser.filter((node) => {
                var _a;
                return node.kind === typescript_1.default.SyntaxKind.VariableDeclaration && ((_a = node.type) === null || _a === void 0 ? void 0 : _a.kind) === typescript_1.default.SyntaxKind.TypeReference
                    && node.type.typeName.escapedText === 'EntitySchema';
            }, { recursive: true, firstOnly: false });
            if (schemas.length) {
                node_utils_1.Terminal.success(`${logFileName}`);
            }
            for (const schema of schemas) {
                const schemaName = schema.name.text;
                const generateTypesFileIdentifier = parser.findIdentifier('generateTypesFile', schema);
                const generateTypesFile = generateTypesFileIdentifier ? parser.getPropertyValue(generateTypesFileIdentifier) : true;
                if (generateTypesFile) {
                    const name = parser.getPropertyValue(parser.findIdentifier('name', schema));
                    const entityName = AppApiClient.resolveEntityName(name);
                    const backendIdentifier = parser.findIdentifier('backend', schema);
                    const backend = backendIdentifier ? parser.getPropertyValue(backendIdentifier) : undefined;
                    const backendName = AppApiClient.resolveEntityName((backend || name));
                    if (verbose)
                        node_utils_1.Terminal.log(`  + ${schemaName}`);
                    const detail = parser.findIdentifier('detail', schema);
                    const list = parser.findIdentifier('list', schema);
                    if (detail) {
                        const interfaceName = (0, node_utils_1.toPascalCase)(entityName.singular);
                        try {
                            if (!interfaces.some(i => i.name === interfaceName)) {
                                const entityInterface = yield this.processEntity(entityName.singular, backendName.singular, schemaName, detail, parser, file, { verbose, commented });
                                if (!verbose)
                                    node_utils_1.Terminal.log(`  + ${interfaceName}`);
                                interfaces.push(entityInterface);
                            }
                        }
                        catch (error) {
                            errors.push({ file, interfaceName, message: (error === null || error === void 0 ? void 0 : error.message) || error });
                            node_utils_1.Terminal.fail(`${chalk_1.default.bold.red(interfaceName)}: ${chalk_1.default.red((error === null || error === void 0 ? void 0 : error.message) || error)}`, { indent: verbose ? '    ' : '  ', check: 'x' });
                        }
                    }
                    if (list) {
                        const interfaceName = (0, node_utils_1.toPascalCase)(entityName.plural);
                        try {
                            if (!interfaces.some(i => i.name === interfaceName)) {
                                const entityInterface = yield this.processEntity(entityName.plural, backendName.plural, schemaName, list, parser, file, { verbose, commented });
                                if (!verbose)
                                    node_utils_1.Terminal.log(`  + ${interfaceName}`);
                                interfaces.push(entityInterface);
                            }
                        }
                        catch (error) {
                            errors.push({ file, interfaceName, message: (error === null || error === void 0 ? void 0 : error.message) || error });
                            node_utils_1.Terminal.fail(`${chalk_1.default.bold.red(interfaceName)}: ${chalk_1.default.red((error === null || error === void 0 ? void 0 : error.message) || error)}`, { indent: verbose ? '    ' : '  ', check: 'x' });
                        }
                    }
                }
                else {
                    node_utils_1.Terminal.log(`  - ${schemaName} (skip types generation)`);
                }
            }
            if (interfaces.length) {
                const typesFileName = file.name.replace(/\.schema\.ts$/, '.types.ts');
                node_utils_1.Resource.save(node_utils_1.Resource.concat(file.path, typesFileName), interfaces.map(i => i.content).join(`\n\n`));
                if (node_utils_1.Resource.exists(node_utils_1.Resource.concat(file.path, 'index.ts'))) {
                    const parserIndex = new typescript_parser_1.TypescriptParser(node_utils_1.Resource.concat(file.path, 'index.ts'));
                    const moduleSpecifier = typesFileName.replace(/\.ts$/, '');
                    const exports = parserIndex.filter(node => node.kind === typescript_1.default.SyntaxKind.ExportDeclaration, { firstOnly: false });
                    const exportTypes = exports.find(e => e.moduleSpecifier.text === `./${moduleSpecifier}`);
                    if (exportTypes === null || exportTypes === void 0 ? void 0 : exportTypes.exportClause) {
                        parserIndex.replacements.push({ start: exportTypes.exportClause.pos + 1, end: exportTypes.exportClause.end, text: `{ ${interfaces.map(i => i.name).join(', ')} }` });
                    }
                    else {
                        parserIndex.insertAfter(exports.length ? exports[exports.length - 1] : undefined, `export { ${interfaces.map(i => i.name).join(', ')} } from './${moduleSpecifier}';`);
                    }
                    parserIndex.save();
                }
            }
            return { interfaces, errors };
        });
    }
    processEntity(entityName, backendName, schemaName, entity, parser, file, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const verbose = options.verbose === undefined ? false : options.verbose;
            const commented = options.commented === undefined ? true : options.commented;
            node_utils_1.Terminal.logInline(`${verbose ? '    ' : '  '}- Processing ${chalk_1.default.bold(schemaName)}...`);
            const { fields, relations, params } = this.buildSchemaQuery(entity, parser, file);
            const query = `schema/${backendName}?fields=${fields}&rel=${relations}${params}`;
            if (verbose)
                node_utils_1.Terminal.log(`    + Query: ${chalk_1.default.gray(query)}`);
            if (verbose)
                node_utils_1.Terminal.logInline(`    - Requesting schema ${chalk_1.default.bold(schemaName)} to database...`);
            const result = yield this.get(query);
            if (Array.isArray(result)) {
                throw new Error('No se podido obtener el esquema de la base de datos.');
            }
            const schema = this.generateSchema(entity, parser, result);
            const interfaceName = `${(0, node_utils_1.toPascalCase)(entityName)}`;
            if (verbose)
                node_utils_1.Terminal.log(`    + Creating interface ${chalk_1.default.bold(interfaceName)}`);
            return {
                name: interfaceName,
                content: this.stringifySchema(schema, interfaceName, { commented }),
            };
        });
    }
    buildSchemaQuery(entity, parser, file) {
        const relationsProperty = parser.find((node) => node.kind === typescript_1.default.SyntaxKind.PropertyAssignment && node.name.text === 'relations', { parent: entity.initializer, recursive: false, firstOnly: true });
        let schemaRelations;
        if (relationsProperty) {
            if (relationsProperty.initializer.kind === typescript_1.default.SyntaxKind.Identifier) {
                const relationsVariableName = relationsProperty.initializer.text;
                const relationsLocalDeclaration = parser.find((node) => node.kind === typescript_1.default.SyntaxKind.VariableDeclaration && node.name.text === relationsVariableName, { recursive: true, firstOnly: true });
                if (relationsLocalDeclaration === null || relationsLocalDeclaration === void 0 ? void 0 : relationsLocalDeclaration.initializer) {
                    schemaRelations = parser.parsePropertyInitializer(relationsLocalDeclaration.initializer);
                }
                else {
                    const imports = parser.getImportDeclarations();
                    const importFound = imports.find(i => parser.getImportClauseNames(i).includes(relationsVariableName));
                    if (importFound) {
                        const moduleSpecifier = `${importFound.moduleSpecifier.text}.ts`;
                        const countBacks = moduleSpecifier.split('/').filter(s => s === '..').length;
                        const importFileName = moduleSpecifier.startsWith('../') ? node_utils_1.Resource.concat(node_utils_1.Resource.split(file.path).slice(0, -countBacks).join('/'), moduleSpecifier.substring('../'.length * countBacks)) :
                            moduleSpecifier.startsWith('./') ? node_utils_1.Resource.concat(file.path, moduleSpecifier.substring(2)) :
                                node_utils_1.Resource.concat(file.path, moduleSpecifier);
                        const importParser = new typescript_parser_1.TypescriptParser(importFileName);
                        const relationsImportedDeclaration = importParser.find((node) => node.kind === typescript_1.default.SyntaxKind.VariableDeclaration && node.name.text === relationsVariableName, { recursive: true, firstOnly: true });
                        schemaRelations = parser.parsePropertyInitializer(relationsImportedDeclaration.initializer);
                    }
                }
            }
            else {
                schemaRelations = parser.getPropertyValue(relationsProperty);
            }
        }
        const relations = Array.isArray(schemaRelations) ? schemaRelations.join(',') : schemaRelations || '';
        const fieldsProperty = parser.find((node) => node.kind === typescript_1.default.SyntaxKind.PropertyAssignment && node.name.text === 'fields', { parent: entity.initializer, recursive: false, firstOnly: true });
        const fieldsValue = fieldsProperty ? parser.getPropertyValue(fieldsProperty) : undefined;
        const fields = Array.isArray(fieldsValue) ? fieldsValue.join(',') : fieldsValue || '';
        const paramsProperty = parser.find((node) => node.kind === typescript_1.default.SyntaxKind.PropertyAssignment && node.name.text === 'params' && node.initializer.kind !== typescript_1.default.SyntaxKind.ArrowFunction, { parent: entity.initializer, recursive: false, firstOnly: true });
        const paramsValue = paramsProperty ? parser.getPropertyValue(paramsProperty) : undefined;
        const params = Array.isArray(paramsValue) ? `&${paramsValue.join('&')}` : '';
        return { fields, relations, params };
    }
    ;
    generateSchema(entity, parser, schema) {
        const fnProperty = parser.find((node) => node.kind === typescript_1.default.SyntaxKind.PropertyAssignment && node.name.text === 'mapSchema', { parent: entity.initializer, recursive: false, firstOnly: true });
        if (!fnProperty) {
            return schema;
        }
        const source = typescript_1.default.createSourceFile('', '', typescript_1.default.ScriptTarget.Latest, false, typescript_1.default.ScriptKind.TS);
        const printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
        const fnDefinition = printer.printNode(typescript_1.default.EmitHint.Unspecified, fnProperty.initializer, source);
        if (!fnDefinition) {
            return schema;
        }
        const fnCode = typescript_1.default.transpile(fnDefinition).replace(/\n/g, '').replace(/;$/, '');
        const wrapper = `({ fn: ${fnCode} });`;
        let runnable = eval(wrapper);
        try {
            runnable = eval(wrapper);
        }
        catch (e) {
            throw new Error(`Evaluando el código '${fnDefinition}'\n${e}\n\n> wrapper:\n${wrapper}`);
        }
        schema = runnable.fn(schema);
        return schema;
    }
    stringifySchema(entity, name, options) {
        if (!options) {
            options = {};
        }
        const commented = options.commented === undefined ? false : options.commented;
        const interfaceDeclaration = typescript_1.default.factory.createInterfaceDeclaration([typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword)], name, undefined, undefined, this.createInterfaceMembers(entity, name));
        const source = typescript_1.default.createSourceFile('', '', typescript_1.default.ScriptTarget.Latest, false, typescript_1.default.ScriptKind.TS);
        const printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
        const result = printer.printNode(typescript_1.default.EmitHint.Unspecified, interfaceDeclaration, source).replace(/    /g, '  ').replace(/"/g, '\'');
        if (commented) {
            const comment = `/**\n * \`\`\`typescript\n * ${result.replace(/\n/g, '\n * ')}\n * \`\`\`\n *\/\n`;
            return `${comment}${result}`;
        }
        else {
            return result;
        }
    }
    ;
    createInterfaceMembers(entity, parentTypeName) {
        const sort = false;
        if (sort) {
            entity.fields = entity.fields.sort((a, b) => (a.Field > b.Field) ? 1 : -1);
            entity.parentTables = (entity.parentTables || []).sort((a, b) => (a.tableAlias > b.tableAlias) ? 1 : -1);
            entity.childTables = (entity.childTables || []).sort((a, b) => (a.tableAlias > b.tableAlias) ? 1 : -1);
        }
        const members = entity.fields.map(f => {
            return typescript_1.default.factory.createPropertySignature(undefined, f.Field, f.optional ? typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken) : undefined, this.createInterfaceFieldType(f));
        });
        (entity.parentTables || []).map(parent => {
            var _a;
            const name = parent.tableAlias.split('.').pop() || parent.name.singular;
            const foreignChild = entity.fields.find(f => { var _a; return f.Field === ((_a = parent.relation) === null || _a === void 0 ? void 0 : _a.child.field); });
            const isNullable = !foreignChild || foreignChild.Null === 'YES';
            if ((_a = parent.relation) === null || _a === void 0 ? void 0 : _a.is_circular_reference) {
                const circularTypeName = parentTypeName || (0, node_utils_1.toPascalCase)(parent.tableAlias.split('.').pop() || parent.name.singular);
                members.push(typescript_1.default.factory.createPropertySignature(undefined, name, isNullable ? typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken) : undefined, typescript_1.default.factory.createTypeReferenceNode(typescript_1.default.factory.createIdentifier(circularTypeName))));
            }
            else {
                members.push(typescript_1.default.factory.createPropertySignature(undefined, name, isNullable ? typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken) : undefined, typescript_1.default.factory.createTypeLiteralNode(this.createInterfaceMembers(parent))));
            }
        });
        (entity.childTables || []).map(child => {
            const name = child.tableAlias.split('.').pop() || child.name.plural;
            members.push(typescript_1.default.factory.createPropertySignature(undefined, name, undefined, typescript_1.default.factory.createArrayTypeNode(typescript_1.default.factory.createTypeLiteralNode(this.createInterfaceMembers(child)))));
        });
        return members;
    }
    ;
    createInterfaceFieldType(field) {
        return field.Null === 'YES' ? typescript_1.default.factory.createUnionTypeNode([
            AppApiClient.createKeywordType(field.Type),
            typescript_1.default.factory.createLiteralTypeNode(typescript_1.default.factory.createNull()),
        ]) : AppApiClient.createKeywordType(field.Type);
    }
    static createKeywordType(Type) {
        if (AppApiClient.isArray(Type))
            return typescript_1.default.factory.createArrayTypeNode(AppApiClient.createKeywordType(Type.slice(1, -1)));
        if (AppApiClient.isBooleanType(Type))
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.BooleanKeyword);
        if (AppApiClient.isStringType(Type))
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword);
        if (AppApiClient.isDatetimeType(Type))
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword);
        if (AppApiClient.isNumberType(Type))
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.NumberKeyword);
        if (AppApiClient.isJsonType(Type))
            return typescript_1.default.factory.createUnionTypeNode([
                typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword),
                typescript_1.default.factory.createTypeLiteralNode([typescript_1.default.factory.createIndexSignature(undefined, [typescript_1.default.factory.createParameterDeclaration(undefined, undefined, 'key', undefined, typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword), undefined)], typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword))])
            ]);
        if (Type === '')
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword);
        throw new Error(`Unrecognized database type '${Type}'.`);
    }
    ;
    static isArray(Type) { return /^\[[^]*\]$/.test(Type); }
    static isJsonType(Type) { return Type.startsWith('longtext'); }
    static isBooleanType(Type) { return Type.startsWith('tinyint(1)') || Type.startsWith('bool') || Type.startsWith('boolean'); }
    static isDatetimeType(Type) { return Type.startsWith('datetime') || Type.startsWith('date') || Type.startsWith('time'); }
    static isStringType(Type) { return Type.startsWith('varchar') || Type.startsWith('char') || Type.startsWith('text'); }
    static isNumberType(Type) {
        return Type.startsWith('int') || Type.startsWith('integer') || Type.startsWith('smallint') || Type.startsWith('mediumint') || Type.startsWith('bigint') ||
            Type.startsWith('float') || Type.startsWith('double') || Type.startsWith('decimal') || Type.startsWith('dec') || Type.startsWith('numeric') ||
            (Type.startsWith('tinyint') && !Type.startsWith('tinyint(1)'));
    }
    static resolveEntityName(name) {
        if (typeof name === 'object') {
            return name;
        }
        return { singular: name.endsWith('s') ? name.substring(0, name.length - 1) : name, plural: name };
    }
}
exports.AppApiClient = AppApiClient;
//# sourceMappingURL=app-api-client.js.map