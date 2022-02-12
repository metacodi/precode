"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaParser = void 0;
class JavaParser {
    constructor() {
    }
    foo() { return 'bar'; }
    static parse(fullName, content) {
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
        const results = JavaParser.filter(nodes, match, options);
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
                    if (match.includes(node.kind)) {
                        results.push(node);
                    }
                }
                if (results.length && options.firstOnly) {
                    return results;
                }
                if (options.recursive) {
                }
            }
        }
        return results;
    }
}
exports.JavaParser = JavaParser;
//# sourceMappingURL=java-parser.js.map