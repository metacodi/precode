import fs from 'fs';

import { parse as xmlParseFn, DocumentCstNode } from '@xml-tools/parser';
import { buildAst, accept, XMLDocument, XMLAstNode, XMLElement, XMLAttribute, XMLTextContent } from '@xml-tools/ast';

import { Terminal, Resource, ResourceType } from '@metacodi/node-utils';

import { TextReplacement } from './types';


/** {@link https://www.npmjs.com/package/@xml-tools/ast XML AST} */
export class XmlParser {
  /** Contingut de l'arxiu. */
  content: string;
  /** AST de l'arxiu. */
  document: XMLDocument;
  /** Substitucions del contingut que s'aplicaran al guardar l'arxiu. */
  replacements: TextReplacement[] = [];

  static parse(fullName: string, content?: string): XMLDocument {
    if (!content && !fs.existsSync(fullName)) { return undefined; }
    const { cst, tokenVector } = xmlParseFn(content || fs.readFileSync(fullName, 'utf-8'));
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
    if (options.firstOnly === undefined) { options.firstOnly = false; }

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
            // console.log('child =>', child.name);
            results.push(...XmlParser.filter(child, match, options));
            if (results.length && options.firstOnly) { break; }
          }
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
    const { cst, tokenVector } = xmlParseFn(this.content);
    this.document = buildAst(cst as DocumentCstNode, tokenVector);
  }

  find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): any {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = true; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }
    if (!nodes) { nodes = this.document; }
    return XmlParser.find(nodes, match, options);
  }

  filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): any[] {
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = false; }
    if (!nodes) { nodes = this.document; }
    return XmlParser.filter(nodes, match, options);
  }

  /**
   * Retorna el node indicat.
   *
   * Sintaxis:
   * - `>` separa els elements anidats d'una branca del document.
   * - `[0]` indica la posició (zero-based) de l'element en la col·lecció.
   * - ` attr` (amb un espai al davant) indica un atribut de l'element actual.
   *
   * ```typescript
   * // Retorna l'atribut `color` de l'element `icon`, fill del tercer element `person`, fill de l'element `people`.
   * const node = resolvePath(`people>person[2]>icon color`)
   * // Camins relatius (el camí no comença per l'element root)
   * // Primer element <person> trobat
   * `person>icon color`
   * // Tercer element <person> trobat.
   * `person[2]>icon color`
   * // Tercer element fill de people.
   * `people>[2]>icon color`
   * ```
   */
  resolvePath(path: string, options?: { parent?: XMLElement }): XMLElement | XMLAttribute | XMLTextContent {
    if (!options) { options = {}; }
    const root = options.parent === undefined ? this.document.rootElement : options.parent;
    const elements = path.split('>');
    const resolved = [];
    let found: XMLElement;
    while (elements.length) {
      const segment = elements.shift();
      const { el, idx, attr } = this.parsePathSegment(segment);
      // console.log({ el, idx, attr });
      resolved.push(segment);
      if (!found) {
        if (el === root.name) {
          found = root;
        } else {
          // Cerquem l'element en l'arbre sintàctic.
          if (idx > -1) {
            const filtered = this.filter(root.subElements, (node: XMLElement) => node.name === el, { recursive: true, firstOnly: false });
            if (idx < filtered.length) { found = filtered[idx]; }
          } else {
            found = this.find(root.subElements, (node: XMLElement) => node.name === el, { recursive: true, firstOnly: true });
          }
        }
      } else {
        const children = found.subElements.filter(sub => !el || sub.name === el);
        if (!children.length) { throw Error(`No s'ha trobat cap fill '${el}' de '${resolved.join('>')}'`); }
        if (idx > -1) {
          if (idx > children.length - 1) { throw Error(`No s'ha trobat el fill '${idx}' de '${resolved.join('>')}'`); }
          found = children[idx];
        } else {
          found = children[0];
        }
      }
      if (!found) { throw Error(`No s'ha trobat l'element '${resolved.join('>')}'`); }

      if (attr) {
        if (!found.attributes.length) { throw Error(`No s'ha trobat l'atribut '${attr}' de '${resolved.join('>')}'`); }
        const foundAttr = found.attributes.find(a => a.key === attr);
        if (!foundAttr) { throw Error(`No s'ha trobat l'atribut '${attr}' de '${resolved.join('>')}'`); }
        return foundAttr;
      }
    }
    return found;
  }

  private parsePathSegment(segment: string) {
    const idx = segment.includes('[') ? +segment.substring(segment.indexOf('[') + 1, segment.indexOf(']')) : -1;
    const attr = segment.includes(' ') ? segment.split(' ')[1] : '';
    const el = segment.replace(`[${idx}]`, '').split(' ')[0];
    return { el, idx, attr };
  }

  replaceName(node: string | XMLElement | XMLAttribute | XMLTextContent, text: string) {
    if (typeof node === 'string') { node = this.resolvePath(node); }
    // console.log(node);
    if (node.type === 'XMLElement') {
      const element = node as XMLElement;
      this.replacements.push({ start: element.syntax.openName.startOffset, end: element.syntax.openName.endOffset + 1, text });
      this.replacements.push({ start: element.syntax.closeName.startOffset, end: element.syntax.closeBody.endOffset, text });
    } else if (node.type === 'XMLAttribute') {
      const attribute = node as XMLAttribute;
      this.replacements.push({ start: attribute.syntax.key.startOffset, end: attribute.syntax.key.endOffset + 1, text });
    } else if (node.type === 'XMLTextContent') {
      this.replacements.push({ start: node.position.startOffset, end: node.position.endOffset + 1, text });
    }
  }

  replaceValue(node: string | XMLElement | XMLAttribute | XMLTextContent, text: string) {
    if (typeof node === 'string') { node = this.resolvePath(node); }
    // console.log(node);
    if (node.type === 'XMLElement') {
      const element = node as XMLElement;
      this.replacements.push({ start: element.syntax.openBody.endOffset + 1, end: element.syntax.closeBody.startOffset, text });
    } else if (node.type === 'XMLAttribute') {
      const attribute = node as XMLAttribute;
      this.replacements.push({ start: attribute.syntax.value.startOffset + 1, end: attribute.syntax.value.endOffset, text });
    } else if (node.type === 'XMLTextContent') {
      this.replacements.push({ start: node.position.startOffset, end: node.position.endOffset + 1, text });
    }
  }

  replaceNode(node: string | XMLElement | XMLAttribute | XMLTextContent, text: string) {
    if (typeof node === 'string') { node = this.resolvePath(node); }
    // console.log(node);
    this.replacements.push({ start: node.position.startOffset, end: node.position.endOffset + 1, text });
  }

  save() {
    this.replacements.sort((r1, r2) => r2.start - r1.start).map(r => this.content = this.content.slice(0, r.start) + r.text + this.content.slice(r.end));
    fs.writeFileSync(Resource.normalize(this.fullName), this.content);
  }
}
