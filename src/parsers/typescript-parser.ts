import chalk from 'chalk';
import fs from 'fs';
import ts, { RegularExpressionLiteral } from 'typescript';
import { Terminal } from '..';

import { Resource } from '../utils/resource';


export interface TextReplacement {
  start: number;
  end: number;
  text: string;
  priority?: number;
}

export class TypescriptParser {

  /** Contingut de l'arxiu. */
  content: string;
  /** AST de l'arxiu. */
  source: ts.SourceFile;
  /** Substitucions del contingut que s'aplicaran al guardar l'arxiu. */
  replacements: TextReplacement[] = [];

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

  constructor(
    public fullName: string,
    content?: string,
  ) {
    fullName = Resource.normalize(fullName);
    if (!content) {
      // console.log('Sense contingut');
      if (!fs.existsSync(fullName)) { throw Error(`No s'ha trobat l'arxiu '${fullName}'.`); }
      // console.log('L\'arxiu existeix');
      this.content = fs.readFileSync(fullName, 'utf-8');
      // console.log('contingut =>', this.content);
    }
    this.source = ts.createSourceFile(fullName, this.content, ts.ScriptTarget.Latest);
  }

  getPropertyValue(propertyPath: string): string | number | boolean | null | RegExp {
    const property = this.resolvePropertyPath(propertyPath);
    return this.parsePropertyInitializer(property.initializer);
  }

  replaceProperty(propertyPath: string, value: string | number | boolean | null | RegExp) {
    const property = this.resolvePropertyPath(propertyPath);
    const valid = [
      ts.SyntaxKind.StringLiteral,
      ts.SyntaxKind.NumericLiteral,
      ts.SyntaxKind.TrueKeyword,
      ts.SyntaxKind.FalseKeyword,
      ts.SyntaxKind.NullKeyword,
      ts.SyntaxKind.RegularExpressionLiteral,
    ];
    if (!valid.includes(property.initializer.kind)) { throw Error(`El valor de la propietat '${chalk.bold(propertyPath)}' no és una expressió substituïble.`); }
    const propValue = property.initializer as any as ts.LiteralLikeNode;
    const text = typeof value === 'string' ? `'${value}'` : `${value}`;
    const quotes = ts.isStringLiteral(propValue) ? 2 : 0;
    this.replacements.push({ start: propValue.end - propValue.text.length - quotes, end: propValue.end, text });
  }

  parsePropertyInitializer(value: ts.Expression): number | string | boolean | null | RegExp {
    switch (value.kind) {
      case ts.SyntaxKind.StringLiteral: return (value as ts.StringLiteral).text;
      case ts.SyntaxKind.NumericLiteral: return +(value as ts.NumericLiteral).text;
      case ts.SyntaxKind.TrueKeyword: return true;
      case ts.SyntaxKind.FalseKeyword: return false;
      case ts.SyntaxKind.NullKeyword: return null;
      case ts.SyntaxKind.RegularExpressionLiteral: return (value as ts.RegularExpressionLiteral).text;
      default: return value.getText();
    }
  }

  resolvePropertyPath(propertyPath: string): ts.PropertyAssignment {
    const path = propertyPath.split('.');
    let identifier: ts.Node;
    // Iterem l'array per anar cercant recursivament dins dels nodes trobats.
    for (const prop of path) {
      identifier = this.findIdentifier(prop, identifier);
      if (!identifier) { throw Error(`No s'ha trobat l'identificador '${chalk.bold(prop)}' cercant '${chalk.bold(propertyPath)}'`); }
    }
    if (identifier.kind !== ts.SyntaxKind.PropertyAssignment) { throw Error(`La propietat '${chalk.bold(propertyPath)}' no és un node de tipus 'PropertyAssignment'.`); }
    return identifier as ts.PropertyAssignment;
  }

  findIdentifier(name: string, parent: ts.Node, indent = ''): ts.Node {
    indent += '  ';
    // console.log(indent + 'findIdentifier =>', { parent: this.syntaxKindToName(parent?.kind) });
    const nodes = this.getNodes(parent || this.source);
    for (const node of nodes) {
      // Obteneim els fills per buscar l'identificador a dins i tornar el seu pare, pq el node identificador no té referència al seu pare.
      if (this.hasIdentifierChild(name, node, indent)) { return node; }
      // Seguim cercant recursivament.
      const found = this.findIdentifier(name, node, indent);
      if (found) { return found; }
    }
    return undefined;
  }

  hasIdentifierChild(name: string, parent: ts.Node, indent = ''): boolean {
    const children = this.getNodes(parent);
    for (const child of children) {
      // console.log(indent + 'child =>', { child: this.syntaxKindToName(child?.kind) });
      if (child.kind === ts.SyntaxKind.Identifier) {
        // console.log(indent + 'identifier =>', { search: name, current: (child as ts.Identifier).text });
        if ((child as ts.Identifier).text === name) { return true; }
      } else if (child.kind === ts.SyntaxKind.FirstLiteralToken) {
        // NOTA: Si la propietat és un nombre o un literal el tipus es FirstLiteralToken.
        // console.log(indent + 'literalToken =>', { search: name, current: (child as ts.LiteralToken).text });
        if ((child as ts.LiteralToken).text === name) { return true; }
      } else if ((child as any).text) {
        // console.log((child as any).text, ts.SyntaxKind[child.kind]);
      }
    }
    return false;
  }

  getNodes(parent: ts.Node): ts.Node[] {
    if (parent.kind === ts.SyntaxKind.SourceFile) { return (parent as any).statements; }
    const nodes: ts.Node[] = [];
    parent.forEachChild(node => {
      // console.log('child =>', node);
      nodes.push(node);
    });
    return nodes;
  }

  save() {
    this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
    fs.writeFileSync(Resource.normalize(this.fullName), this.content);
  }

}
