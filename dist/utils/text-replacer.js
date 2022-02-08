"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextReplacer = void 0;
class TextReplacer {
    constructor(content) {
        this.replacements = [];
        this.content = content;
    }
    insert(pos, text, priority = 0) {
        const replacement = { start: pos, end: pos, text, priority };
        this.replacements.push(replacement);
        return replacement;
    }
    insertAfter(node, text, priority = 0) {
        const pos = node ? node.end : 0;
        return this.insert(pos, text, priority);
    }
    insertBefore(node, text, priority = 0) {
        const pos = node ? node.pos : 0;
        return this.insert(pos, text, priority);
    }
    replace(start, end, text, priority = 0) {
        const replacement = { start, end, text, priority };
        this.replacements.push(replacement);
        return replacement;
    }
    replaceNode(node, text, priority = 0) {
        const replacement = { start: node.pos, end: node.end, text, priority };
        this.replacements.push(replacement);
        return replacement;
    }
    delete(start, end, priority = 0) {
        const replacement = { start, end, text: '', priority };
        this.replacements.push(replacement);
        return replacement;
    }
    deleteNode(node, priority = 0) {
        const replacement = { start: node.pos, end: node.end, text: '', priority };
        this.replacements.push(replacement);
        return replacement;
    }
    apply(content) {
        let source = content || this.content;
        if (source) {
            this.replacements = this.replacements.sort((r1, r2) => r2.end !== r1.end ? r2.end - r1.end : r1.start !== r2.start ? r2.start - r1.start : r1.priority - r2.priority);
            for (const replacement of this.replacements) {
                source = source.slice(0, replacement.start) + replacement.text + source.slice(replacement.end);
            }
        }
        return source;
    }
}
exports.TextReplacer = TextReplacer;
//# sourceMappingURL=text-replacer.js.map