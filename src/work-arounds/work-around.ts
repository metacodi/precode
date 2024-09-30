import ts from 'typescript';

import { TypescriptParser } from '../parsers/typescript-parser';



/**
 * ```sh
 * node_modules/chokidar/types/index.d.ts(9,14): error TS2420: Class 'import("C:/Users/jordi/work/metacodi/repo/scrownet/dev/websoc/node_modules/chokidar/types/index").FSWatcher' incorrectly implements interface 'import("fs").FSWatcher'.
 *    Type 'FSWatcher' is missing the following properties from type 'FSWatcher': ref, unref
 * ```
 */
export const TS2420_FSWatcher_chokidarTypesIndex = (node_modules = 'node_modules') => {
  const parser = new TypescriptParser(`${node_modules}/chokidar/types/index.d.ts`);
  const fsWatcher = parser.findClassDeclaration('FSWatcher');
  const unref = fsWatcher.members.find(m => (m.name as any)?.escapedText  === 'unref');
  if (!unref) {
    parser.insertAfter(fsWatcher.members[0], `  ref(): this;\n  unref(): this;\n`);
    parser.save();
  }
}


/** Aquest problema apareix pq les signatures de typus de node i lib.dom no coincideixen. Es pot solucionar igualant typescript amb types/node.
 * I pot reaparèixer el problema si tenim una instal·lació global de typescript diferent (npm i -g typescript).
 * 
 * ```sh
 * node_modules/@types/node/globals.d.ts:72:13 - error TS2403: Subsequent variable declarations must have the same type. Variable 'AbortSignal'
 * ```
 * WORK-AROUND: Prenem la interface de node_modules/typescript/lib/lib.dom.d.ts:2335:13 i la substituim a `globals.d.ts`.
 */
export const TS2403_AbortSignal_typesNodeGlobals = (node_modules = 'node_modules') => {
  const parser = new TypescriptParser(`${node_modules}/@types/node/globals.d.ts`);
  const variableDeclaration = parser.find((node: ts.Node | ts.Statement) => 
    node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as ts.Identifier).text === 'AbortSignal'
  , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
  const { pos: start, end } = variableDeclaration.type;
  const text = `{ prototype: AbortSignal; new(): AbortSignal; abort(reason?: any): AbortSignal; timeout(milliseconds: number): AbortSignal; }`;
  parser.replacements.push({ start, end, text });
  parser.save();
}
