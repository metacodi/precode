"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypescriptParser = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const typescript_1 = __importDefault(require("typescript"));
const node_utils_1 = require("@metacodi/node-utils");
class TypescriptParser {
    static parse(fullName, content) {
        if (!content && !fs_1.default.existsSync(fullName)) {
            return undefined;
        }
        content = content || fs_1.default.readFileSync(fullName, 'utf-8');
        return typescript_1.default.createSourceFile(fullName, content, typescript_1.default.ScriptTarget.Latest, true);
    }
    static find(nodes, filter, options) {
        if (!options) {
            options = {};
        }
        if (options.recursive === undefined) {
            options.recursive = true;
        }
        if (options.firstOnly === undefined) {
            options.firstOnly = true;
        }
        const results = TypescriptParser.filter(nodes, filter, options);
        return (results === null || results === void 0 ? void 0 : results.length) ? results[0] : undefined;
    }
    static filter(nodes, filter, options) {
        if (!Array.isArray(nodes)) {
            nodes = [nodes];
        }
        if (typeof filter !== 'function' && !Array.isArray(filter)) {
            filter = [filter];
        }
        if (!options) {
            options = {};
        }
        if (options.recursive === undefined) {
            options.recursive = false;
        }
        if (options.firstOnly === undefined) {
            options.firstOnly = true;
        }
        const results = [];
        for (const node of nodes) {
            if (!results.length || !options.firstOnly) {
                if (typeof filter === 'function') {
                    if (filter(node)) {
                        results.push(node);
                    }
                }
                else if (Array.isArray(filter)) {
                    if (filter.includes(node.kind)) {
                        results.push(node);
                    }
                }
                if (results.length && options.firstOnly) {
                    return results;
                }
                if (options.recursive) {
                    if (node.forEachChild === undefined) {
                        console.log('forEachChild is undefined for: ', node);
                    }
                    node.forEachChild((child) => {
                        if (!results.length || !options.firstOnly) {
                            results.push(...TypescriptParser.filter(child, filter, options));
                        }
                    });
                }
            }
        }
        return results;
    }
    constructor(fullName, content) {
        this.fullName = fullName;
        this.replacements = [];
        fullName = node_utils_1.Resource.normalize(fullName);
        if (!content) {
            if (!fs_1.default.existsSync(fullName)) {
                throw Error(`No s'ha trobat l'arxiu '${fullName}'.`);
            }
            this.content = fs_1.default.readFileSync(fullName, 'utf-8');
        }
        this.source = typescript_1.default.createSourceFile(fullName, this.content, typescript_1.default.ScriptTarget.Latest);
    }
    getImportDeclarations() {
        return TypescriptParser.filter(this.source.statements, typescript_1.default.SyntaxKind.ImportDeclaration, { firstOnly: false });
    }
    getImportClauseNames(node) {
        const names = node.importClause.name ? [node.importClause.name] :
            node.importClause.namedBindings.elements.map((e) => e.propertyName ? e.propertyName.text : e.name.text);
        return names;
    }
    getPropertyValue(propertyPathOrAssignment) {
        const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
        return this.parsePropertyInitializer(property.initializer);
    }
    setPropertyValue(propertyPathOrAssignment, value) {
        const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
        const kind = property.initializer.kind;
        const valid = [
            typescript_1.default.SyntaxKind.StringLiteral,
            typescript_1.default.SyntaxKind.NoSubstitutionTemplateLiteral,
            typescript_1.default.SyntaxKind.NumericLiteral,
            typescript_1.default.SyntaxKind.TrueKeyword,
            typescript_1.default.SyntaxKind.FalseKeyword,
            typescript_1.default.SyntaxKind.NullKeyword,
            typescript_1.default.SyntaxKind.RegularExpressionLiteral,
            typescript_1.default.SyntaxKind.ArrayLiteralExpression,
            typescript_1.default.SyntaxKind.ObjectLiteralExpression,
        ];
        if (!valid.includes(kind)) {
            throw Error(`El valor de la propietat '${chalk_1.default.bold(propertyPathOrAssignment)}' no és una expressió substituïble.`);
        }
        const propValue = property.initializer;
        const text = this.stringifyPrimitiveType(value);
        this.replacements.push({ start: propValue.pos + 1, end: propValue.end, text });
    }
    removeProperty(propertyPathOrAssignment) {
        const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
        this.replacements.push({ start: property.pos, end: property.end + 1, text: '' });
    }
    stringifyPrimitiveType(value) {
        if (Array.isArray(value)) {
            const values = value.map(el => this.stringifyPrimitiveType(el));
            return `[${values.join(', ')}]`;
        }
        else if (value instanceof RegExp) {
            return `${value}`;
        }
        else if (typeof value === 'object') {
            const assigns = Object.keys(value).map(key => {
                const v = this.stringifyPrimitiveType(value[key]);
                return `${key}: ${v}`;
            });
            return `{ ${assigns.join(', ')} }`;
        }
        else if (typeof value === 'string') {
            return `'${value}'`;
        }
        else {
            return `${value}`;
        }
    }
    parsePropertyInitializer(value) {
        switch (value.kind) {
            case typescript_1.default.SyntaxKind.StringLiteral: return value.text;
            case typescript_1.default.SyntaxKind.NoSubstitutionTemplateLiteral: return value.text;
            case typescript_1.default.SyntaxKind.NumericLiteral: return +value.text;
            case typescript_1.default.SyntaxKind.TrueKeyword: return true;
            case typescript_1.default.SyntaxKind.FalseKeyword: return false;
            case typescript_1.default.SyntaxKind.NullKeyword: return null;
            case typescript_1.default.SyntaxKind.RegularExpressionLiteral:
                const text = value.text;
                const pattern = text.replace(/((d|g|i|m|s|u|y)*)$/g, '');
                const flags = text.slice(pattern.length);
                return new RegExp(pattern.slice(1, -1), flags);
            case typescript_1.default.SyntaxKind.ArrayLiteralExpression: return this.parseArrayLiteralExpression(value);
            case typescript_1.default.SyntaxKind.ObjectLiteralExpression: return this.parseObjectLiteralExpression(value);
            default: return value.getText();
        }
    }
    parseArrayLiteralExpression(value) {
        const elements = value.elements.map(el => {
            return this.parsePropertyInitializer(el);
        });
        return elements;
    }
    parseObjectLiteralExpression(value) {
        const obj = {};
        value.properties.map(p => {
            const prop = p;
            const key = prop.name.kind === typescript_1.default.SyntaxKind.Identifier ? prop.name.text
                : prop.name.kind === typescript_1.default.SyntaxKind.FirstLiteralToken ? prop.name.text
                    : prop.name.text;
            const value = this.parsePropertyInitializer(prop.initializer);
            obj[key] = value;
        });
        return obj;
    }
    resolvePropertyPath(propertyPath) {
        const path = propertyPath.split('.');
        let identifier;
        for (const prop of path) {
            identifier = this.findIdentifier(prop, identifier);
            if (!identifier) {
                throw Error(`No s'ha trobat l'identificador '${chalk_1.default.bold(prop)}' cercant '${chalk_1.default.bold(propertyPath)}'`);
            }
        }
        if (identifier.kind !== typescript_1.default.SyntaxKind.PropertyAssignment) {
            throw Error(`La propietat '${chalk_1.default.bold(propertyPath)}' no és un node de tipus 'PropertyAssignment'.`);
        }
        return identifier;
    }
    existsPropertyPath(propertyPath) {
        const path = propertyPath.split('.');
        let identifier;
        for (const prop of path) {
            identifier = this.findIdentifier(prop, identifier);
            if (!identifier) {
                return false;
            }
        }
        if (identifier.kind !== typescript_1.default.SyntaxKind.PropertyAssignment) {
            return false;
        }
        return true;
    }
    findClassDeclaration(name, parent) {
        const nodes = this.getNodes(parent || this.source);
        const found = TypescriptParser.find(nodes, (node) => (node.kind === typescript_1.default.SyntaxKind.ClassDeclaration && node.name.text === name));
        return found;
    }
    findIdentifier(name, parent, indent = '') {
        indent += '  ';
        const hasIdentifier = (name, node, indent = '') => (node.kind === typescript_1.default.SyntaxKind.Identifier && node.text === name) ||
            (node.kind === typescript_1.default.SyntaxKind.VariableDeclaration && node.name.text === name) ||
            (node.kind === typescript_1.default.SyntaxKind.FirstLiteralToken && node.text === name);
        const nodes = this.getNodes(parent || this.source);
        for (const node of nodes) {
            if (hasIdentifier(name, node, indent)) {
                return parent;
            }
            const found = this.findIdentifier(name, node, indent);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
    find(filter, options) {
        const nodes = this.getNodes((options === null || options === void 0 ? void 0 : options.parent) || this.source);
        return TypescriptParser.find(nodes, filter, options);
    }
    filter(filter, options) {
        const nodes = this.getNodes((options === null || options === void 0 ? void 0 : options.parent) || this.source);
        return TypescriptParser.filter(nodes, filter, options);
    }
    getNodes(parent) {
        if (parent.kind === typescript_1.default.SyntaxKind.SourceFile) {
            return parent.statements.map(v => v);
        }
        const nodes = [];
        parent.forEachChild(node => {
            nodes.push(node);
        });
        return nodes;
    }
    insertBefore(node, text) { this.replacements.push({ start: node.pos, end: node.pos, text }); }
    insertAfter(node, text) { this.replacements.push({ start: ((node === null || node === void 0 ? void 0 : node.end) || 0) + 1, end: ((node === null || node === void 0 ? void 0 : node.end) || 0) + 1, text }); }
    save() {
        this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
        fs_1.default.writeFileSync(node_utils_1.Resource.normalize(this.fullName), this.content);
    }
}
exports.TypescriptParser = TypescriptParser;
//# sourceMappingURL=typescript-parser.js.map