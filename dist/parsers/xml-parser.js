"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlParser = void 0;
const fs_1 = __importDefault(require("fs"));
const parser_1 = require("@xml-tools/parser");
const ast_1 = require("@xml-tools/ast");
const node_utils_1 = require("@metacodi/node-utils");
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
    constructor(fullName, content) {
        this.fullName = fullName;
        this.replacements = [];
        fullName = node_utils_1.Resource.normalize(fullName);
        if (content) {
            this.content = content;
        }
        else {
            if (!fs_1.default.existsSync(fullName)) {
                throw Error(`No s'ha trobat l'arxiu '${fullName}'.`);
            }
            this.content = fs_1.default.readFileSync(fullName, 'utf-8');
        }
        const { cst, tokenVector } = (0, parser_1.parse)(this.content);
        this.document = (0, ast_1.buildAst)(cst, tokenVector);
    }
    find(nodes, match, options) {
        if (!options) {
            options = {};
        }
        if (options.recursive === undefined) {
            options.recursive = true;
        }
        if (options.firstOnly === undefined) {
            options.firstOnly = true;
        }
        if (!nodes) {
            nodes = this.document;
        }
        return XmlParser.find(nodes, match, options);
    }
    filter(nodes, match, options) {
        if (!options) {
            options = {};
        }
        if (options.recursive === undefined) {
            options.recursive = false;
        }
        if (options.firstOnly === undefined) {
            options.firstOnly = false;
        }
        if (!nodes) {
            nodes = this.document;
        }
        return XmlParser.filter(nodes, match, options);
    }
    resolvePath(path, options) {
        if (!options) {
            options = {};
        }
        const root = options.parent === undefined ? this.document.rootElement : options.parent;
        const elements = path.split('>');
        const resolved = [];
        let found;
        while (elements.length) {
            const segment = elements.shift();
            const { el, idx, attr } = this.parsePathSegment(segment);
            resolved.push(segment);
            if (!found) {
                if (el === root.name) {
                    found = root;
                }
                else {
                    if (idx > -1) {
                        const filtered = this.filter(root.subElements, (node) => node.name === el, { recursive: true, firstOnly: false });
                        if (idx < filtered.length) {
                            found = filtered[idx];
                        }
                    }
                    else {
                        found = this.find(root.subElements, (node) => node.name === el, { recursive: true, firstOnly: true });
                    }
                }
            }
            else {
                const children = found.subElements.filter(sub => !el || sub.name === el);
                if (!children.length) {
                    throw Error(`No s'ha trobat cap fill '${el}' de '${resolved.join('>')}'`);
                }
                if (idx > -1) {
                    if (idx > children.length - 1) {
                        throw Error(`No s'ha trobat el fill '${idx}' de '${resolved.join('>')}'`);
                    }
                    found = children[idx];
                }
                else {
                    found = children[0];
                }
            }
            if (!found) {
                throw Error(`No s'ha trobat l'element '${resolved.join('>')}'`);
            }
            if (attr) {
                if (!found.attributes.length) {
                    throw Error(`No s'ha trobat l'atribut '${attr}' de '${resolved.join('>')}'`);
                }
                const foundAttr = found.attributes.find(a => a.key === attr);
                if (!foundAttr) {
                    throw Error(`No s'ha trobat l'atribut '${attr}' de '${resolved.join('>')}'`);
                }
                return foundAttr;
            }
        }
        return found;
    }
    parsePathSegment(segment) {
        const idx = segment.includes('[') ? +segment.substring(segment.indexOf('[') + 1, segment.indexOf(']')) : -1;
        const attr = segment.includes(' ') ? segment.split(' ')[1] : '';
        const el = segment.replace(`[${idx}]`, '').split(' ')[0];
        return { el, idx, attr };
    }
    replaceName(node, text) {
        if (typeof node === 'string') {
            node = this.resolvePath(node);
        }
        if (node.type === 'XMLElement') {
            const element = node;
            this.replacements.push({ start: element.syntax.openName.startOffset, end: element.syntax.openName.endOffset + 1, text });
            this.replacements.push({ start: element.syntax.closeName.startOffset, end: element.syntax.closeBody.endOffset, text });
        }
        else if (node.type === 'XMLAttribute') {
            const attribute = node;
            this.replacements.push({ start: attribute.syntax.key.startOffset, end: attribute.syntax.key.endOffset + 1, text });
        }
        else if (node.type === 'XMLTextContent') {
            this.replacements.push({ start: node.position.startOffset, end: node.position.endOffset + 1, text });
        }
    }
    replaceValue(node, text) {
        if (typeof node === 'string') {
            node = this.resolvePath(node);
        }
        if (node.type === 'XMLElement') {
            const element = node;
            this.replacements.push({ start: element.syntax.openBody.endOffset + 1, end: element.syntax.closeBody.startOffset, text });
        }
        else if (node.type === 'XMLAttribute') {
            const attribute = node;
            this.replacements.push({ start: attribute.syntax.value.startOffset + 1, end: attribute.syntax.value.endOffset, text });
        }
        else if (node.type === 'XMLTextContent') {
            this.replacements.push({ start: node.position.startOffset, end: node.position.endOffset + 1, text });
        }
    }
    replaceNode(node, text) {
        if (typeof node === 'string') {
            node = this.resolvePath(node);
        }
        this.replacements.push({ start: node.position.startOffset, end: node.position.endOffset + 1, text });
    }
    save() {
        this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
        fs_1.default.writeFileSync(node_utils_1.Resource.normalize(this.fullName), this.content);
    }
}
exports.XmlParser = XmlParser;
//# sourceMappingURL=xml-parser.js.map