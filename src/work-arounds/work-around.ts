import ts from 'typescript';

import { Terminal } from '@metacodi/node-utils';

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
 * I pot reaparèixer el problema si tenim una instal·lació global de typescript diferent (npm i -g typescript) o bé el VSCode està utilitzant
 * una versió de l'arxiu `lib.dom.ts` que té en cache. Anar-hi per veure la versió de typescript que hi ha al package.json.
 * Ex per Windows: ...\AppData\Local\Programs\Microsoft VS Code\resources\app\extensions\node_modules\typescript\lib\lib.dom.d.ts)
 * Ex per Mac: /Applications/Visual Studio Code.app/Contents/Resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts
 * 
 * ```sh
 * node_modules/@types/node/globals.d.ts:72:13 - error TS2403: Subsequent variable declarations must have the same type. Variable 'AbortSignal'
 * ```
 * WORK-AROUND: Prenem la interface de node_modules/typescript/lib/lib.dom.d.ts:2335:13 i la substituim a `globals.d.ts`.
 */
export const TS2403_AbortSignal_typesNodeGlobals = (node_modules = 'node_modules') => {
  // Obtenim la declaració de la llibreria `lib.dom.d.ts`.
  const parserLib = new TypescriptParser(`${node_modules}/typescript/lib/lib.dom.d.ts`);
  const declarationLib = parserLib.find((node: ts.Node | ts.Statement) => 
    node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as ts.Identifier).text === 'AbortSignal'
  , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
  if (declarationLib === undefined) {
    Terminal.error({ message: `No s'ha trobat la varaible 'AbortSignal' a '${node_modules}/typescript/lib/lib.dom'.` }, /* exit */ false);
  } else {
    const { pos: start, end, text } = declarationLib.type as any;
    const abortSignalCode = parserLib.content.slice(start, end);
    // console.log('abortSignalCode =>', abortSignalCode);
    // Cerquem i substituim la declaració de `globals.d.ts`.
    const parser = new TypescriptParser(`${node_modules}/@types/node/globals.d.ts`);
    const variableDeclaration = parser.find((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as ts.Identifier).text === 'AbortSignal'
    , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
    if (variableDeclaration === undefined) {
      Terminal.error({ message: `No s'ha trobat la varaible 'AbortSignal' a '${node_modules}/@types/node/globals.d.ts'.` }, /* exit */ false);
    } else {
      const { pos: start, end } = variableDeclaration.type as ts.TypeNode;
      // const text = `{ prototype: AbortSignal; new(): AbortSignal; abort(reason?: any): AbortSignal; any(signals: AbortSignal[]): AbortSignal; timeout(milliseconds: number): AbortSignal; }`;
      const text = abortSignalCode;
      parser.replacements.push({ start, end, text });
      parser.save();  
    }
  }
}

TS2403_AbortSignal_typesNodeGlobals();