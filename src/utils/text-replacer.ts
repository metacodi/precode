import * as ts from 'typescript';

export interface TextReplacement {
  start: number;
  end: number;
  text: string;
  priority?: number;
}

/**
 * Define y aplica operaciones de inserción, susticución y eliminación de texto del contenido indicado.
 */
export class TextReplacer {

  /** Contenido sobre el que se aplicarán las sustituciones definidas. */
  content: string;
  /** Acciones de sustitución definidas para el contenido. */
  replacements: TextReplacement[] = [];

  constructor(content?: string) {
    this.content = content;
  }

  /**
   * Define una inserción de texto en el contenido.
   *
   * Insertamos una sentencia de importación al final del bloque de importaciones (después del lastImport).
   * ```typescript
   * replacer.insert(lastImport.end, `\nimport { NgModule } from '@angular/core';`);
   * ```
   */
  insert(pos: number, text: string, priority = 0): TextReplacement {
    const replacement: TextReplacement = { start: pos, end: pos, text, priority };
    this.replacements.push(replacement);
    return replacement;
  }

  /**
   * Define una inserción de texto en la posición del contenido definida por `node.end`.
   *
   * Insertamos una sentencia de importación al final del bloque de importaciones (después del lastImport).
   * ```typescript
   * const newImport = `\nimport { NgModule } from '@angular/core';`;
   * replacer.insertAfter(node, newImport);
   * ```
   */
  insertAfter(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, text: string, priority = 0): TextReplacement {
    const pos = node ? node.end : 0;
    return this.insert(pos, text, priority);
  }

  /**
   * Define una inserción de texto en la posición del contenido definida por `node.start`.
   *
   * Insertamos una sentencia de importación al final del bloque de importaciones (después del lastImport).
   * ```typescript
   * const newImport = `\nimport { NgModule } from '@angular/core';`;
   * replacer.insertBefore(node, newImport);
   * ```
   */
  insertBefore(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, text: string, priority = 0): TextReplacement {
    const pos = node ? node.pos : 0;
    return this.insert(pos, text, priority);
  }

  /**
   * Define una sustitución de texto en el contenido.
   *
   * Remplazamos una sentencia de importación por otra.
   * ```typescript
   * replacer.replace(oldImport.start, oldImport.end, `\nimport { NgModule } from '@angular/core';`);
   * ```
   */
  replace(start: number, end: number, text: string, priority = 0): TextReplacement {
    const replacement: TextReplacement = { start, end, text, priority };
    this.replacements.push(replacement);
    return replacement;
  }

  /**
   * Define una sustitución de texto en el contenido.
   *
   * Remplazamos una sentencia de importación por otra.
   * ```typescript
   * const newImport = `\nimport { NgModule } from '@angular/core';`;
   * replacer.replaceNode(oldImport, newImport);
   * ```
   */
  replaceNode(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, text: string, priority = 0): TextReplacement {
    const replacement: TextReplacement = { start: node.pos, end: node.end, text, priority };
    this.replacements.push(replacement);
    return replacement;
  }

  /**
   * Define una eliminación de texto del contenido.
   *
   * Eliminamos una declaración de importación.
   * ```typescript
   * replacer.delete(oldImport.start, oldImport.end);
   * ```
   */
  delete(start: number, end: number, priority = 0): TextReplacement {
    const replacement: TextReplacement = { start, end, text: '', priority };
    this.replacements.push(replacement);
    return replacement;
  }

  /**
   * Define una eliminación de texto del contenido.
   *
   * Eliminamos una declaración de importación.
   * ```typescript
   * replacer.deleteNode(oldImport.start, oldImport.end);
   * ```
   */
  deleteNode(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, priority = 0): TextReplacement {
    const replacement: TextReplacement = { start: node.pos, end: node.end, text: '', priority };
    this.replacements.push(replacement);
    return replacement;
  }

  /**
   * Aplica las substituciones de texto en el contenido indicado.
   *
   * - Primero las ordena por posición dentro del contenido de forma descendente para empezar por el final.
   * - Después aplica las inserciones/sustituciones en ese orden.
   *
   * ```typescript
   * const source = replacer.apply(source);
   * ```
   *
   * @param content: Indica un contenido sobre el que aplicar las operaciones de sustitución.
   */
  apply(content?: string): string {
    let source = content || this.content;
    if (source) {
      this.replacements = this.replacements.sort((r1, r2) =>
        r2.end !== r1.end ? r2.end - r1.end : r1.start !== r2.start ? r2.start - r1.start : r1.priority - r2.priority,
      );
      for (const replacement of this.replacements) {
        source = source.slice(0, replacement.start) + replacement.text + source.slice(replacement.end);
      }
    }
    return source;
  }
}
