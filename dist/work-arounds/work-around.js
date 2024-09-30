"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TS2403_AbortSignal_typesNodeGlobals = exports.TS2420_FSWatcher_chokidarTypesIndex = void 0;
const typescript_1 = __importDefault(require("typescript"));
const typescript_parser_1 = require("../parsers/typescript-parser");
const TS2420_FSWatcher_chokidarTypesIndex = (node_modules = 'node_modules') => {
    const parser = new typescript_parser_1.TypescriptParser(`${node_modules}/chokidar/types/index.d.ts`);
    const fsWatcher = parser.findClassDeclaration('FSWatcher');
    const unref = fsWatcher.members.find(m => { var _a; return ((_a = m.name) === null || _a === void 0 ? void 0 : _a.escapedText) === 'unref'; });
    if (!unref) {
        parser.insertAfter(fsWatcher.members[0], `  ref(): this;\n  unref(): this;\n`);
        parser.save();
    }
};
exports.TS2420_FSWatcher_chokidarTypesIndex = TS2420_FSWatcher_chokidarTypesIndex;
const TS2403_AbortSignal_typesNodeGlobals = (node_modules = 'node_modules') => {
    const parser = new typescript_parser_1.TypescriptParser(`${node_modules}/@types/node/globals.d.ts`);
    const variableDeclaration = parser.find((node) => node.kind === typescript_1.default.SyntaxKind.VariableDeclaration && node.name.text === 'AbortSignal', { recursive: true, firstOnly: true });
    const { pos: start, end } = variableDeclaration.type;
    const text = `{ prototype: AbortSignal; new(): AbortSignal; abort(reason?: any): AbortSignal; timeout(milliseconds: number): AbortSignal; }`;
    parser.replacements.push({ start, end, text });
    parser.save();
};
exports.TS2403_AbortSignal_typesNodeGlobals = TS2403_AbortSignal_typesNodeGlobals;
//# sourceMappingURL=work-around.js.map