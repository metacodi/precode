"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaParser = void 0;
const fs_1 = __importDefault(require("fs"));
const java_ast_1 = require("java-ast");
const resource_1 = require("../utils/resource");
class JavaParser {
    constructor(fullName, content) {
        this.fullName = fullName;
        this.replacements = [];
        fullName = resource_1.Resource.normalize(fullName);
        if (content) {
            this.content = content;
        }
        else {
            if (!fs_1.default.existsSync(fullName)) {
                throw Error(`No s'ha trobat l'arxiu '${fullName}'.`);
            }
            this.content = fs_1.default.readFileSync(fullName, 'utf-8');
        }
        this.document = java_ast_1.parse(this.content);
        console.log(this.document);
    }
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
            options.recursive = true;
        }
        if (options.firstOnly === undefined) {
            options.firstOnly = false;
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
    save() {
        this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
        fs_1.default.writeFileSync(resource_1.Resource.normalize(this.fullName), this.content);
    }
}
exports.JavaParser = JavaParser;
//# sourceMappingURL=java-parser.js.map