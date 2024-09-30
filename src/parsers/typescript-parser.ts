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

  static getNodes(parent: ts.Node): ts.Node[] {
    if (parent.kind === ts.SyntaxKind.SourceFile) { return (parent as ts.SourceFile).statements.map(v => v); }
    const nodes: ts.Node[] = [];
    parent.forEachChild(node => {
      // console.log('child =>', node);
      nodes.push(node);
    });
    return nodes;
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

  
  // --------------------------------------------------------------------------------
  //  save
  // --------------------------------------------------------------------------------

  save() {
    this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
    fs.writeFileSync(Resource.normalize(this.fullName), this.content);
  }

  
  // --------------------------------------------------------------------------------
  //  imports
  // --------------------------------------------------------------------------------

  getImportDeclarations(): ts.ImportDeclaration[] {
    return TypescriptParser.filter(this.source.statements, ts.SyntaxKind.ImportDeclaration, { firstOnly: false }) as ts.ImportDeclaration[];
  }

  getImportClauseNames(node: ts.ImportDeclaration) {
    const names = node.importClause.name ? [node.importClause.name] :
      (node.importClause.namedBindings as ts.NamedImports).elements.map((e: any) => e.propertyName ? e.propertyName.text : e.name.text);
    return names;
  }


  // --------------------------------------------------------------------------------
  //  properties
  // --------------------------------------------------------------------------------

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
      ts.SyntaxKind.NoSubstitutionTemplateLiteral,
      ts.SyntaxKind.NumericLiteral,
      ts.SyntaxKind.TrueKeyword,
      ts.SyntaxKind.FalseKeyword,
      ts.SyntaxKind.NullKeyword,
      ts.SyntaxKind.RegularExpressionLiteral,
      ts.SyntaxKind.ArrayLiteralExpression,
      ts.SyntaxKind.ObjectLiteralExpression,
      ts.SyntaxKind.PropertyAccessExpression, // Alignment.TopRight
      ts.SyntaxKind.ElementAccessExpression,
    ];
    if (!valid.includes(kind)) { throw Error(`El valor de la propietat '${chalk.bold(propertyPathOrAssignment)}' no és una expressió substituïble.`); }
    const propValue = property.initializer as any as ts.LiteralLikeNode;
    const text = this.stringifyPrimitiveType(value);
    this.replacements.push({ start: propValue.pos + 1, end: propValue.end, text });
  }

  removeProperty(propertyPathOrAssignment: string | ts.PropertyAssignment) {
    const property = typeof propertyPathOrAssignment === 'string' ? this.resolvePropertyPath(propertyPathOrAssignment) : propertyPathOrAssignment;
    this.replacements.push({ start: property.pos, end: property.end + 1, text: '' });  
  }

  private stringifyPrimitiveType(value: PrimitiveType): string {
    if (Array.isArray(value)) {
      const values: string[] = value.map(el => this.stringifyPrimitiveType(el));
      return `[${values.join(', ')}]`;

    } else if (value instanceof RegExp) {
      return `${value}`;

    } else if (typeof value === 'object') {
      const assigns: string[] = Object.keys(value).map(key => {
        const v = this.stringifyPrimitiveType((value as any)[key]);
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
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: return (value as ts.NoSubstitutionTemplateLiteral).text;
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
      /**
       * // case ts.SyntaxKind.PropertyAccessExpression: return this.parsePropertyAccessExpression(value as ts.PropertyAccessExpression);  
       * 
       * NOTA: El problema és que un PropertyAccessExpression és en realitat una referència a un membre o propietat d'un objecte
       * del qual, des de l'àmbit actual, no en tenim cap referència de la instància real.
       */
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

  parsePropertyAccessExpression(value: ts.PropertyAccessExpression): any {

    // NOTA: Aquesta funció no és un "parser" perquè donada l'expressió hauria de retornar una referència a
    // la propietat de l'objecte real, però això no és possible des d'aquest àmbit pq no tenim accés a la instància.
    // Actualment aquesta funció fa més d'"stringify" perquè està retornant el text de codi de l'expressió.

    // NOTA: una property access es composa d'una expressió al davant i un identificador al darrera separats per un punt.
    // L'expressió pot ser un identificador o bé una property access (dos o més identificadors separats per un punt)
    // Ex: Position.TopRight, on Position seria una expressió de tipus identificador i TopRight el nom de l'identificador.
    // Ex: Config.Alignment.Center, on Config.Alignment seria una expressió de tipus PropertyAccessExpression i Center el nom de l'identificador.

    const parts = [];
    // 1) Processem l'expressió
    switch (value.expression.kind) {
      case ts.SyntaxKind.Identifier:
        // Ex: Position
        parts.push((value.expression as ts.Identifier).text);
        break;
      case ts.SyntaxKind.PropertyAccessExpression:
        // Ex: Config.Alignment
        parts.push(this.parsePropertyAccessExpression(value.expression as ts.PropertyAccessExpression));
        break;
    }
    // 2) Afegim el nom de l'identificador. Ex: TopRight | Center
    parts.push(value.name.text);
    // 3) Juntem les parts: expressió + identificador. Ex: Position.TopRight | Config.Alignment.Center
    return parts.join('.');
  }

  resolvePropertyPath(propertyPath: string): ts.PropertyAssignment | ts.VariableDeclaration {
    const path = propertyPath.split('.');
    let identifier: ts.Node;
    // Iterem l'array per anar cercant recursivament dins dels nodes trobats.
    for (const prop of path) {
      identifier = this.findIdentifier(prop, identifier);
      if (!identifier) { throw Error(`No s'ha trobat l'identificador '${chalk.bold(prop)}' cercant '${chalk.bold(propertyPath)}'`); }
    }

    if (identifier.kind === ts.SyntaxKind.PropertyAssignment) {
      return identifier as ts.PropertyAssignment;

    } else if (identifier.kind === ts.SyntaxKind.VariableDeclaration) {
      return identifier as ts.VariableDeclaration;

    } else if (identifier.kind === ts.SyntaxKind.VariableDeclarationList) {
      const list = identifier as ts.VariableDeclarationList;
      if (list.declarations.length === 0) {
        throw Error(`La propietat '${chalk.bold(propertyPath)}' és un node de tipus 'VariableDeclarationList' que no té cap declaració implementada.`);
      } else if (list.declarations.length > 1) {
        throw Error(`La propietat '${chalk.bold(propertyPath)}' és un node de tipus 'VariableDeclarationList' que té més d'una declaració implementada.`);
      } else {
        return list.declarations[0];
      }
    } else {
      throw Error(`La propietat '${chalk.bold(propertyPath)}' no és cap node de tipus 'PropertyAssignment' o 'VariableDeclaration'.`);
    }
  }

  existsPropertyPath(propertyPath: string): boolean {
    const path = propertyPath.split('.');
    let identifier: ts.Node;
    // Iterem l'array per anar cercant recursivament dins dels nodes trobats.
    for (const prop of path) {
      identifier = this.findIdentifier(prop, identifier);
      if (!identifier) { return false }
    }

    if (identifier.kind === ts.SyntaxKind.PropertyAssignment) {
      return true

    } else if (identifier.kind === ts.SyntaxKind.VariableDeclaration) {
      const list = identifier as ts.VariableDeclarationList;
      const va = list.declarations[0];
      return true;

    } else if (identifier.kind === ts.SyntaxKind.VariableDeclarationList) {
      const list = identifier as ts.VariableDeclarationList;
      return list.declarations.length === 1;

    } else {
      return false;
    }
  }


  // --------------------------------------------------------------------------------
  //  find & replace
  // --------------------------------------------------------------------------------

  /** Cerca recursivament els nodes de l'arbre AST per trobar la declaració d'una classe (`ts.ClassDeclaration`) que coincideixi amb el nom indicat. 
   * 
   * ```typescript
   * const sample = parser.findClassDeclaration('SampleClass');
   * const items = sample.members.find(m => m.name.getText() === 'items');
   * ```
   */
  findClassDeclaration(name: string, parent?: ts.Node): ts.ClassDeclaration {
    const nodes = TypescriptParser.getNodes(parent || this.source);
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
      (node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as any).text === name) ||
      (node.kind === ts.SyntaxKind.FirstLiteralToken && (node as ts.LiteralToken).text === name)
    ;
    // console.log(indent + 'findIdentifier =>', { parent: this.syntaxKindToName(parent?.kind) });
    const nodes = TypescriptParser.getNodes(parent || this.source);
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
    const nodes = TypescriptParser.getNodes(options?.parent || this.source);
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
    const nodes = TypescriptParser.getNodes(options?.parent || this.source);
    return TypescriptParser.filter(nodes, filter, options);
  }


  // --------------------------------------------------------------------------------
  //  nodes
  // --------------------------------------------------------------------------------

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
  insertAfter(node: ts.Node, text: string) { this.replacements.push({ start: (node?.end || 0) + 1, end: (node?.end || 0) + 1, text }); }

}
