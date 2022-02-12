"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypescriptParser = void 0;
const fs_1 = __importDefault(require("fs"));
const typescript_1 = __importDefault(require("typescript"));
class TypescriptParser {
    constructor() {
    }
    foo() { return 'bar'; }
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
}
exports.TypescriptParser = TypescriptParser;
//# sourceMappingURL=typescript-parser.js.map