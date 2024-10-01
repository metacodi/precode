import ts from "typescript";

import { Terminal } from "@metacodi/node-utils";

import { TypescriptParser } from "../../src";


/**
 * ```
 * npx ts-node scripts/test/test-work-around.ts
 * ```
 */


export const TS2403_AbortSignal_typesNodeGlobals = (node_modules = 'node_modules') => {
  const parserLib = new TypescriptParser(`${node_modules}/typescript/lib/lib.dom.d.ts`);
  const declarationLib = parserLib.find((node: ts.Node | ts.Statement) => 
    node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as ts.Identifier).text === 'AbortSignal'
  , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
  if (declarationLib === undefined) {
    Terminal.error({ message: `No s'ha trobat la varaible 'AbortSignal' a '${node_modules}/typescript/lib/lib.dom'.` })
  } else {
    const { pos: start, end, text } = declarationLib.type as any;
    // const abortSignalCode = declarationLib.getText();
    const abortSignalCode = parserLib.content.slice(start, end);
    console.log('abortSignalCode =>', abortSignalCode);

    const parser = new TypescriptParser(`${node_modules}/@types/node/globals.d.ts`);
    const variableDeclaration = parser.find((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as ts.Identifier).text === 'AbortSignal'
    , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
    if (variableDeclaration === undefined) {
      Terminal.error({ message: `No s'ha trobat la varaible 'AbortSignal' a '${node_modules}/@types/node/globals.d.ts'.` })
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