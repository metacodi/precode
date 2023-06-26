import chalk from 'chalk';
import fs from 'fs';
import ts, { RegularExpressionLiteral } from 'typescript';

import { Terminal, Resource, ResourceType } from '@metacodi/node-utils';

import { TextReplacement } from './types';


export type PrimitiveType = BasicPrimitiveType | ComplexPrimitiveType;

export type BasicPrimitiveType = string | number | boolean | null | RegExp;

export type ComplexPrimitiveType = object | Array<PrimitiveType>;

export type EmptyPrimitiveType = undefined | never | unknown | void;

/**
 * La classe _TypescriptParser_ permet interpretar el contingut d'un arxiu amb codi font **TypeScript**.
 * 
 * El contingut s'estructura en un arbre de nodes que es conneix com a **arbre sintàctic abstracte** (AST, de l'anglès _Abstract Syntax Tree_).
 * 
 * TypeScript AST Viewer: <https://ts-ast-viewer.com/>
 * 
 * <br />
 * 
 * ## Ús
 * 
 * ```typescript
 * const parser = new TypescriptParser(`src/app/sample-class.ts`);
 * ```
 * 
 * Després de crear la instància, des del constructor el parser s'encarrega de llegir i interpretar el contingut de l'arxiu indicat.
 * 
 * També es pot instanciar amb un contingut específic (a més a més del nom de l'arxiu on s'escriurà el resultat, encara que no existeixi).
 * 
 * ```typescript
 * const content = `export class NewSampleClass {}`;
 * const parser = new TypescriptParser(`src/app/new-sample-class.ts`, content);
 * ```
 * 
 * Després de la manipulcació de l'arxiu a través dels mètodes que ofereix el parser, caldrà guardar els canvis:
 * 
 * ```typescript
 * parser.save();
 * ```
 */
export class TypescriptParser {
  /** Contingut de l'arxiu. */
  content: string;
  /** AST de l'arxiu. */
  source: ts.SourceFile;
  /** Substitucions del contingut que s'aplicaran al guardar l'arxiu. */
  replacements: TextReplacement[] = [];

  static parse(fullName: string, content?: string): ts.SourceFile {
    if (!content && !fs.existsSync(fullName)) { return undefined; }
    content = content || fs.readFileSync(fullName, 'utf-8');
    return ts.createSourceFile(fullName, content, ts.ScriptTarget.Latest, true);
  }

  static find(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): ts.Node {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results = TypescriptParser.filter(nodes, filter, options);
    return results?.length ? results[0] : undefined;
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

  getPropertyValue(propertyPathOrAssignment: string | ts.PropertyAssignment): PrimitiveType  {
    const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
    return this.parsePropertyInitializer(property.initializer);
  }

  /** Permet susbtituir el valor de la propietat d'un objecte.
   * 
   * ```typescript
   * const parser = new TypescriptParser(`src/app/config.ts`);
   * parser.setPropertyValue('AppConfig.env', 'dev');
   * parser.save();
   * ```
   */
  setPropertyValue(propertyPathOrAssignment: string | ts.PropertyAssignment, value: PrimitiveType) {
    const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
    const kind = property.initializer.kind;
    const valid = [
      ts.SyntaxKind.StringLiteral,
      ts.SyntaxKind.NumericLiteral,
      ts.SyntaxKind.TrueKeyword,
      ts.SyntaxKind.FalseKeyword,
      ts.SyntaxKind.NullKeyword,
      ts.SyntaxKind.RegularExpressionLiteral,
      ts.SyntaxKind.ArrayLiteralExpression,
      ts.SyntaxKind.ObjectLiteralExpression,
    ];
    if (!valid.includes(kind)) { throw Error(`El valor de la propietat '${chalk.bold(propertyPathOrAssignment)}' no és una expressió substituïble.`); }
    const propValue = property.initializer as any as ts.LiteralLikeNode;
    const text = this.getValueText(value);
    this.replacements.push({ start: propValue.pos + 1, end: propValue.end, text });
  }

  removeProperty(propertyPathOrAssignment: string | ts.PropertyAssignment) {
    const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
    this.replacements.push({ start: property.pos, end: property.end + 1, text: '' });  
  }

  private getValueText(value: PrimitiveType): string {
    if (Array.isArray(value)) {
      const values: string[] = value.map(el => this.getValueText(el));
      return `[${values.join(', ')}]`;

    } else if (value instanceof RegExp) {
      return `${value}`;

    } else if (typeof value === 'object') {
      const assigns: string[] = Object.keys(value).map(key => {
        const v = this.getValueText((value as any)[key]);
        return `${key}: ${v}`;
      });
      return `{ ${assigns.join(', ')} }`;

    } else if (typeof value === 'string') {
      return `'${value}'`;

    } else {
      return `${value}`;
    }
  }

  parsePropertyInitializer(value: ts.Expression): PrimitiveType {
    switch (value.kind) {
      case ts.SyntaxKind.StringLiteral: return (value as ts.StringLiteral).text;
      case ts.SyntaxKind.NumericLiteral: return +(value as ts.NumericLiteral).text;
      case ts.SyntaxKind.TrueKeyword: return true;
      case ts.SyntaxKind.FalseKeyword: return false;
      case ts.SyntaxKind.NullKeyword: return null;
      case ts.SyntaxKind.RegularExpressionLiteral:
        const text = (value as ts.RegularExpressionLiteral).text;
        const pattern = text.replace(/((d|g|i|m|s|u|y)*)$/g, '');
        const flags = text.slice(pattern.length);
        return new RegExp(pattern.slice(1, -1), flags);
      case ts.SyntaxKind.ArrayLiteralExpression: return this.parseArrayLiteralExpression(value as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ObjectLiteralExpression: return this.parseObjectLiteralExpression(value as ts.ObjectLiteralExpression);
      default: return value.getText();
    }
  }

  parseArrayLiteralExpression(value: ts.ArrayLiteralExpression): PrimitiveType[] {
    const elements: PrimitiveType[] = value.elements.map(el => {
      return this.parsePropertyInitializer(el);
    });
    return elements;
  }

  parseObjectLiteralExpression(value: ts.ObjectLiteralExpression): object {
    const obj: { [key: string]: any } = {};
    value.properties.map(p => {
      const prop = p as ts.PropertyAssignment;
      const key = prop.name.kind === ts.SyntaxKind.Identifier ? (prop.name as ts.Identifier).text
        : prop.name.kind === ts.SyntaxKind.FirstLiteralToken ? (prop.name as ts.LiteralToken).text
        : (prop.name as any).text
      const value = this.parsePropertyInitializer(prop.initializer);
      obj[key] = value;
    });
    return obj;
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

  existsPropertyPath(propertyPath: string): boolean {
    const path = propertyPath.split('.');
    let identifier: ts.Node;
    // Iterem l'array per anar cercant recursivament dins dels nodes trobats.
    for (const prop of path) {
      identifier = this.findIdentifier(prop, identifier);
      if (!identifier) { return false }
    }
    if (identifier.kind !== ts.SyntaxKind.PropertyAssignment) { return false; }
    return true;
  }

  /** Cerca recursivament els nodes de l'arbre AST per trobar la declaració d'una classe (`ts.ClassDeclaration`) que coincideixi amb el nom indicat. 
   * 
   * ```typescript
   * const sample = parser.findClassDeclaration('SampleClass');
   * const items = sample.members.find(m => m.name.getText() === 'items');
   * ```
   */
  findClassDeclaration(name: string, parent?: ts.Node): ts.ClassDeclaration {
    const nodes = this.getNodes(parent || this.source);
    const found = TypescriptParser.find(nodes, (node: ts.Node): boolean =>
      (node.kind === ts.SyntaxKind.ClassDeclaration && (node as ts.ClassDeclaration).name.text === name)
    );
    return found as ts.ClassDeclaration;
  }

  /** Cerca recursivament els nodes de l'arbre AST per trobar un identificador (`ts.Identifier | ts.LiteralToken`) que coincideixi amb el nom indicat.
   *
   * ```typescript
   * const sample = parser.findClassDeclaration('SampleClass');
   * ```
   */
  findIdentifier(name: string, parent?: ts.Node, indent = ''): ts.Node {
    indent += '  ';
    const hasIdentifier = (name: string, node: ts.Node, indent = ''): boolean =>
      (node.kind === ts.SyntaxKind.Identifier && (node as ts.Identifier).text === name) ||
      (node.kind === ts.SyntaxKind.FirstLiteralToken && (node as ts.LiteralToken).text === name)
    ;
    // console.log(indent + 'findIdentifier =>', { parent: this.syntaxKindToName(parent?.kind) });
    const nodes = this.getNodes(parent || this.source);
    for (const node of nodes) {
      // Tornem el seu pare, pq el node identificador no té referència al seu pare.
      if (hasIdentifier(name, node, indent)) { return parent; }
      // Seguim cercant recursivament.
      const found = this.findIdentifier(name, node, indent);
      if (found) { return found; }
    }
    return undefined;
  }

  /** Travessa l'arbre AST cercant fins que trobi un node amb les opcions de filtre indicades.
   * 
   * ```typescript
   * const items = parser.find((node: ts.Node | ts.Statement) =>
   *   node.kind === ts.SyntaxKind.PropertyDeclaration && (node as ts.PropertyDeclaration).name.text === 'items'
   * );
   * ```
   */
  find(filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean, parent?: ts.Node }): ts.Node {
    const nodes = this.getNodes(options?.parent || this.source);
    return TypescriptParser.find(nodes, filter, options);
  }

  /** Travessa l'arbre AST cercant nodes segons les opcions de filtre indicades.
   * 
   * ```typescript
   * const options = { recursive: true };
   * const variables = parser.filter(ts.VariableDeclaration, options);
   * const variables = parser.filter((node: ts.Node | ts.Statement) =>
   *   node.kind === ts.SyntaxKind.VariableDeclaration && (node as ts.VariableDeclaration).name.text.startsWith('test')
   * , options);
   * ```
   */
  filter(filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean, parent?: ts.Node }): ts.Node[] {
    const nodes = this.getNodes(options?.parent || this.source);
    return TypescriptParser.filter(nodes, filter, options);
  }

  getNodes(parent: ts.Node): ts.Node[] {
    if (parent.kind === ts.SyntaxKind.SourceFile) { return (parent as ts.SourceFile).statements.map(v => v); }
    const nodes: ts.Node[] = [];
    parent.forEachChild(node => {
      // console.log('child =>', node);
      nodes.push(node);
    });
    return nodes;
  }

  /** Insereix un text abans del node indicat.
   * 
   * ```typescript
   * const parser = new TypescriptParser(fileName);
   * const invoices = parser.findIdentifier('invoices') as ts.VariableDeclaration;
   * const arr = invoices.initializer as ts.ArrayLiteralExpression;
   * const first = arr.elements[0];
   * parser.insertBefore(first, `  { num: 123, total: 1055.55 },\n`);
   * parser.save();
   * ```
   */
  insertBefore(node: ts.Node, text: string) { this.replacements.push({ start: node.pos, end: node.pos, text }); }

  /** Insereix un text a continuació del node indicat.
   * 
   * ```typescript
   * const parser = new TypescriptParser(fileName);
   * const invoices = parser.findIdentifier('invoices') as ts.VariableDeclaration;
   * const arr = invoices.initializer as ts.ArrayLiteralExpression;
   * const last = arr.elements[arr.elements.length - 1];
   * parser.insertAfter(last, `\n  { num: 123, total: 1055.55 },`);
   * parser.save();
   * ```
   */
  insertAfter(node: ts.Node, text: string) { this.replacements.push({ start: node.end + 1, end: node.end + 1, text }); }

  save() {
    this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
    fs.writeFileSync(Resource.normalize(this.fullName), this.content);
  }

}
