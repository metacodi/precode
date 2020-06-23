import fs from 'fs';
import php, { Program, Node } from 'php-parser';


export class PhpParser {

  static parse(fullName: string, content?: string): Program {
    if (!content && !fs.existsSync(fullName)) { return undefined; }
    const parser = new php({ ast: { withPositions: true }});
    return parser.parseCode(content || fs.readFileSync(fullName, 'utf-8'));
  }

  static find(nodes: any, filter: string | string[] | ((node: Node | Program) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): Node {
    const results = PhpParser.filter(nodes, filter, options);
    return results && results.length ? results[0] : undefined;
  }

  static filter(nodes: any, filter: string | string[] | ((node: Node | Program) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): Node[] {
    if (!Array.isArray(nodes)) { nodes = [nodes]; }
    if (typeof filter !== 'function' && !Array.isArray(filter)) { filter = [filter]; }
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results: Node[] = [];

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
}
