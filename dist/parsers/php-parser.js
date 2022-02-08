"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpParser = void 0;
const fs_1 = __importDefault(require("fs"));
const php_parser_1 = __importDefault(require("php-parser"));
class PhpParser {
    static parse(fullName, content) {
        if (!content && !fs_1.default.existsSync(fullName)) {
            return undefined;
        }
        const parser = new php_parser_1.default({ ast: { withPositions: true } });
        return parser.parseCode(content || fs_1.default.readFileSync(fullName, 'utf-8'));
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
        const results = PhpParser.filter(nodes, filter, options);
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
                    const children = Array.isArray(node.children) ? node.children : (Array.isArray(node.body) ? node.body : (node.body ? node.body.children : []));
                    for (const child of children) {
                        results.push(...PhpParser.filter(child, filter, options));
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
exports.PhpParser = PhpParser;
//# sourceMappingURL=php-parser.js.map