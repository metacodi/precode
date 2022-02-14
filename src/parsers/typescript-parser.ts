import fs from 'fs';
import ts from 'typescript';


export class TypescriptParser {

  constructor() {

  }

  static parse(fullName: string, content?: string): ts.SourceFile {
    if (!content && !fs.existsSync(fullName)) { return undefined; }
    return ts.createSourceFile(fullName, content || fs.readFileSync(fullName, 'utf-8'), ts.ScriptTarget.Latest, true);
  }

  static find(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): ts.Node {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results = TypescriptParser.filter(nodes, filter, options);
    return results && results.length ? results[0] : undefined;
  }

  static filter(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): ts.Node[] {
    if (!Array.isArray(nodes)) { nodes = [nodes]; }
    if (typeof filter !== 'function' && !Array.isArray(filter)) { filter = [filter]; }
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results: (ts.Node | ts.Statement)[] = [];

    for (const node of nodes) {
      if (!results.length || !options.firstOnly) {

        if (typeof filter === 'function') {
          if (filter(node)) { results.push(node); }
        } else if (Array.isArray(filter)) {
          if ((filter as ts.SyntaxKind[]).includes(node.kind)) { results.push(node); }
        }
        if (results.length && options.firstOnly) { return results; }

        if (options.recursive) {
          if (node.forEachChild === undefined) { console.log('forEachChild is undefined for: ', node); }
          node.forEachChild((child: ts.Node | ts.Statement) => {
            if (!results.length || !options.firstOnly) {
              results.push(...TypescriptParser.filter(child, filter, options));
            }
          });
        }
      }
    }
    return results;
  }

  foo() { return 'bar'; }

}
