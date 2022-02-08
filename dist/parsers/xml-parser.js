"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlParser = void 0;
const fs_1 = __importDefault(require("fs"));
const parser_1 = require("@xml-tools/parser");
const ast_1 = require("@xml-tools/ast");
class XmlParser {
    static parse(fullName, content) {
        if (!content && !fs_1.default.existsSync(fullName)) {
            return undefined;
        }
        const { cst, tokenVector } = (0, parser_1.parse)(content || fs_1.default.readFileSync(fullName, 'utf-8'));
        return (0, ast_1.buildAst)(cst, tokenVector);
    }
    static find(nodes, match, options) {
        if (!options) {
            options = {};
        }
        if (options.recursive === undefined) {
            options.recursive = true;
        }
        if (options.firstOnly === undefined) {
            options.firstOnly = true;
        }
        const results = XmlParser.filter(nodes, match, options);
        return results && results.length ? results[0] : undefined;
    }
    static filter(nodes, match, options) {
        if (!Array.isArray(nodes)) {
            nodes = [nodes];
        }
        if (typeof match !== 'function' && !Array.isArray(match)) {
            match = [match];
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
                if (typeof match === 'function') {
                    if (match(node)) {
                        results.push(node);
                    }
                }
                else if (Array.isArray(match)) {
                    if (match.includes(node.name)) {
                        results.push(node);
                    }
                }
                if (results.length && options.firstOnly) {
                    return results;
                }
                if (options.recursive) {
                    const children = node.subElements || [node.rootElement] || [];
                    for (const child of children) {
                        console.log('child =>', child.name);
                        results.push(...XmlParser.filter(child, match, options));
                        if (results.length && options.firstOnly) {
                            break;
                        }
                    }
                }
            }
        }
        return results;
    }
}
exports.XmlParser = XmlParser;
//# sourceMappingURL=xml-parser.js.map