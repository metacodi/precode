"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = exports.applyFilterPattern = void 0;
function applyFilterPattern(text, pattern) {
    if (!pattern || !text) {
        return true;
    }
    if (typeof pattern === 'string') {
        const tester = new RegExp(pattern);
        return tester.test(text);
    }
    else if (pattern instanceof RegExp) {
        const tester = pattern;
        return tester.test(text);
    }
    else if (typeof pattern === 'function') {
        return pattern(text);
    }
    else if (typeof pattern === 'object') {
        if (pattern.test instanceof RegExp) {
            const tester = pattern.test;
            return tester.test(text);
        }
        else if (typeof pattern.test === 'function') {
            const tester = pattern.test;
            return tester(text);
        }
    }
    else {
        return true;
    }
}
exports.applyFilterPattern = applyFilterPattern;
function capitalize(text) {
    if (typeof text !== 'string') {
        return '';
    }
    if (text.length < 2) {
        return text.toUpperCase();
    }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
exports.capitalize = capitalize;
//# sourceMappingURL=functions.js.map