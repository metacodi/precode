"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeMajorVersion = exports.upgradeMinorVersion = exports.upgradePatchVersion = exports.capitalize = exports.applyFilterPattern = void 0;
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
            const test = pattern.test;
            return test(text);
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
const upgradePatchVersion = (version) => {
    const newVersion = version.split('.');
    newVersion[2] = `${+newVersion[2] + 1}`;
    return newVersion.join('.');
};
exports.upgradePatchVersion = upgradePatchVersion;
const upgradeMinorVersion = (version) => {
    const newVersion = version.split('.');
    newVersion[1] = `${+newVersion[1] + 1}`;
    newVersion[2] = '0';
    return newVersion.join('.');
};
exports.upgradeMinorVersion = upgradeMinorVersion;
const upgradeMajorVersion = (version) => {
    const newVersion = version.split('.');
    newVersion[0] = `${+newVersion[0] + 1}`;
    newVersion[1] = '0';
    newVersion[2] = '0';
    return newVersion.join('.');
};
exports.upgradeMajorVersion = upgradeMajorVersion;
//# sourceMappingURL=functions.js.map