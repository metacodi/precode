import fs from 'fs';

import { parse as parser, DocumentCstNode } from '@xml-tools/parser';
import { buildAst, accept, XMLDocument } from '@xml-tools/ast';

/** <https://www.npmjs.com/package/@xml-tools/ast> */
export class XmlParser {

  static parse(fullName: string, content?: string): XMLDocument {
    if (!content && !fs.existsSync(fullName)) { return undefined; }
    const { cst, tokenVector } = parser(content || fs.readFileSync(fullName, 'utf-8'));
    return buildAst(cst as DocumentCstNode, tokenVector);
  }

  static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): any {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results = XmlParser.filter(nodes, match, options);
    return results && results.length ? results[0] : undefined;
  }

  static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): any[] {
    if (!Array.isArray(nodes)) { nodes = [nodes]; }
    if (typeof match !== 'function' && !Array.isArray(match)) { match = [match]; }
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results: any[] = [];

    for (const node of nodes) {
      if (!results.length || !options.firstOnly) {

        if (typeof match === 'function') {
          if (match(node)) { results.push(node); }
        } else if (Array.isArray(match)) {
          if ((match as string[]).includes(node.name)) { results.push(node); }
        }
        if (results.length && options.firstOnly) { return results; }

        if (options.recursive) {
          // En funció del tipus de node: XmlDocument.rootElement | XmlElement.subElements
          const children = node.subElements || [ node.rootElement ] || [];
          for (const child of children) {
            console.log('child =>', child.name);
            results.push(...XmlParser.filter(child, match, options));
            if (results.length && options.firstOnly) { break; }
          }
        }
      }
    }
    return results;
  }
}
