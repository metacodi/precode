"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = void 0;
function capitalize(s) {
    if (typeof s !== 'string') {
        return '';
    }
    if (s.length < 2) {
        return s.toUpperCase();
    }
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
exports.capitalize = capitalize;
//# sourceMappingURL=functions.js.map