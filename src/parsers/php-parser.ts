import fs from 'fs';
import chalk from 'chalk';

import { Terminal } from '@metacodi/node-utils';

import { Engine, Program, Node } from 'php-parser';


/** {@link https://www.npmjs.com/package/php-parser PHP Parser} */
export class PhpParser {

  static parse(fullName: string, content?: string): Program {
    if (!content && !fs.existsSync(fullName)) { return undefined; }
    const parser = new Engine({ ast: { withPositions: true }});
    return parser.parseEval(content || fs.readFileSync(fullName, 'utf-8'));
  }

  static find(nodes: any, filter: string | string[] | ((node: Node | Program) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): Node {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results = PhpParser.filter(nodes, filter, options);
    return results && results.length ? results[0] : undefined;
  }

  static filter(nodes: any, filter: string | string[] | ((node: Node | Program) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): Node[] {
    if (!Array.isArray(nodes)) { nodes = [nodes]; }
    if (typeof filter !== 'function' && !Array.isArray(filter)) { filter = [filter]; }
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results: any[] = [];

    for (const node of nodes) {
      if (!results.length || !options.firstOnly) {

        if (typeof filter === 'function') {
          if (filter(node)) { results.push(node); }
        } else if (Array.isArray(filter)) {
          if ((filter as string[]).includes(node.kind)) { results.push(node); }
        }
        if (results.length && options.firstOnly) { return results; }

        if (options.recursive) {
          // En funció del tipus de node: Program.children | Class.body | Method.body.children | ForEach.body.children | ...
          const children = Array.isArray(node.children) ? node.children : (Array.isArray(node.body) ? node.body : (node.body ? node.body.children : []));

          for (const child of children) {
            results.push(...PhpParser.filter(child, filter, options));
            if (results.length && options.firstOnly) { break; }
          }
        }
      }
    }
    return results;
  }
 
  /** Atraviesa el AST en busca de un nodo con la declaración de la clase indicada. */
  static findClassDeclaration(name: string, source: any, throwError = true): Node {
    const classe = PhpParser.find(source, (node: Node): boolean => node.kind === 'class' && (node as any).name && (node as any).name.name === name);
    if (!classe && throwError) { Terminal.error(`No s'ha trobat la classe '${chalk.bold(name)}'.`, false); return undefined; }
    return classe;
  }

}
