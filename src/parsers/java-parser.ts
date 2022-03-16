import fs from 'fs';


export class JavaParser {

  constructor() {

  }

  static parse(fullName: string, content?: string): any {
    // if (!content && !fs.existsSync(fullName)) { return undefined; }
    // const { cst, tokenVector } = parser(content || fs.readFileSync(fullName, 'utf-8'));
    // return buildAst(cst as DocumentCstNode, tokenVector);
  }

  static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): any {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results = JavaParser.filter(nodes, match, options);
    return results && results.length ? results[0] : undefined;
  }

  static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): any[] {
    if (!Array.isArray(nodes)) { nodes = [nodes]; }
    if (typeof match !== 'function' && !Array.isArray(match)) { match = [match]; }
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results: Node[] = [];

    for (const node of nodes) {
      if (!results.length || !options.firstOnly) {

        if (typeof match === 'function') {
          if (match(node)) { results.push(node); }
        } else if (Array.isArray(match)) {
          if ((match as string[]).includes(node.kind)) { results.push(node); }
        }
        if (results.length && options.firstOnly) { return results; }

        if (options.recursive) {
          // accept(node, {
          //   visitXMLElement: (n: any) => {
          //     if (!results.length || !options.firstOnly) {
          //       results.push(...XmlParser.filter(n, match, options));
          //     }
          //   }
          // });
        }
      }
    }
    return results;
  }

  foo() { return 'bar'; }
}

