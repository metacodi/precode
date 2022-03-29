import fs from 'fs';
import { parse as javaParseFn, ParseTree, createVisitor } from 'java-ast';

import { Resource } from '../utils/resource';
import { TextReplacement } from './types';


export class JavaParser {
  /** Contingut de l'arxiu. */
  content: string;
  /** AST de l'arxiu. */
  document: ParseTree;
  /** Substitucions del contingut que s'aplicaran al guardar l'arxiu. */
  replacements: TextReplacement[] = [];

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
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = false; }

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

  constructor(
    public fullName: string,
    content?: string,
  ) {
    fullName = Resource.normalize(fullName);
    if (content) {
      this.content = content;
    } else {
      // console.log('Sense contingut');
      if (!fs.existsSync(fullName)) { throw Error(`No s'ha trobat l'arxiu '${fullName}'.`); }
      // console.log('L\'arxiu existeix');
      this.content = fs.readFileSync(fullName, 'utf-8');
      // console.log('contingut =>', this.content);
    }
    this.document = javaParseFn(this.content);
    console.log(this.document);
  }


  save() {
    this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
    fs.writeFileSync(Resource.normalize(this.fullName), this.content);
  }
}

