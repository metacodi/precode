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
    static parse(fullName, content) {
        if (!content && !fs_1.default.existsSync(fullName)) {
            return undefined;
        }
        return typescript_1.default.createSourceFile(fullName, content || fs_1.default.readFileSync(fullName, 'utf-8'), typescript_1.default.ScriptTarget.Latest, true);
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
        return results && results.length ? results[0] : undefined;
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
    getPropertyValue(propertyPath) {
        const property = this.resolvePropertyPath(propertyPath);
        return this.parsePropertyInitializer(property.initializer);
    }
    replaceProperty(propertyPath, value) {
        const property = this.resolvePropertyPath(propertyPath);
        const valid = [
            typescript_1.default.SyntaxKind.StringLiteral,
            typescript_1.default.SyntaxKind.NumericLiteral,
            typescript_1.default.SyntaxKind.TrueKeyword,
            typescript_1.default.SyntaxKind.FalseKeyword,
            typescript_1.default.SyntaxKind.NullKeyword,
            typescript_1.default.SyntaxKind.RegularExpressionLiteral,
        ];
        if (!valid.includes(property.initializer.kind)) {
            throw Error(`El valor de la propietat '${chalk_1.default.bold(propertyPath)}' no és una expressió substituïble.`);
        }
        const propValue = property.initializer;
        const text = typeof value === 'string' ? `'${value}'` : `${value}`;
        this.replacements.push({ start: propValue.pos + 1, end: propValue.end, text });
    }
    parsePropertyInitializer(value) {
        switch (value.kind) {
            case typescript_1.default.SyntaxKind.StringLiteral: return value.text;
            case typescript_1.default.SyntaxKind.NumericLiteral: return +value.text;
            case typescript_1.default.SyntaxKind.TrueKeyword: return true;
            case typescript_1.default.SyntaxKind.FalseKeyword: return false;
            case typescript_1.default.SyntaxKind.NullKeyword: return null;
            case typescript_1.default.SyntaxKind.RegularExpressionLiteral: return value.text;
            default: return value.getText();
        }
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
    findIdentifier(name, parent, indent = '') {
        indent += '  ';
        const nodes = this.getNodes(parent || this.source);
        for (const node of nodes) {
            if (this.hasIdentifierChild(name, node, indent)) {
                return node;
            }
            const found = this.findIdentifier(name, node, indent);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
    hasIdentifierChild(name, parent, indent = '') {
        const children = this.getNodes(parent);
        for (const child of children) {
            if (child.kind === typescript_1.default.SyntaxKind.Identifier) {
                if (child.text === name) {
                    return true;
                }
            }
            else if (child.kind === typescript_1.default.SyntaxKind.FirstLiteralToken) {
                if (child.text === name) {
                    return true;
                }
            }
            else if (child.text) {
            }
        }
        return false;
    }
    getNodes(parent) {
        if (parent.kind === typescript_1.default.SyntaxKind.SourceFile) {
            return parent.statements;
        }
        const nodes = [];
        parent.forEachChild(node => {
            nodes.push(node);
        });
        return nodes;
    }
    insertBefore(node, text) { this.replacements.push({ start: node.pos, end: node.pos, text }); }
    insertAfter(node, text) { this.replacements.push({ start: node.end + 1, end: node.end + 1, text }); }
    save() {
        this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
        fs_1.default.writeFileSync(node_utils_1.Resource.normalize(this.fullName), this.content);
    }
}
exports.TypescriptParser = TypescriptParser;
//# sourceMappingURL=typescript-parser.js.map