#!/usr/bin/env node
import * as ts from 'typescript';
import { TextReplacer } from './utils/text-replacer';

export type ActionType = 'add' | 'remove';

export type ProjectType = 'typescript' | 'php';

export interface ResourceType {
  name: string;
  path: string;
  fullName: string;
  size?: number;
  created?: Date;
  modified?: Date;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  children?: ResourceType[];
}

/** Describe los detalles de una acción de sustitución de código. */
export interface ReplaceOptions {
  /** Texto informativo que se muestra en la consola. */
  description?: string;
  /** Indica si se aplicará el _flag_ global `g` al ejecutar la expresión regular de `match`. */
  global?: boolean;
  /** Indica si se aplicará el _flag_ case insensitive `i` al ejecutar la expresión regular de `match`. */
  insensitive?: boolean;
  /** Expresión para el texto de búsqueda. */
  match?: string | RegExp;
  /** Expresión que se utilizará para el texto de sustitución. */
  replace?: string | ((source: any, replacer: TextReplacer) => void);
  /** Si se establece, se utiliza para testear contra el contenido y si devuelve `true` entonces no se realizará la sustitución. */
  skip?: string | RegExp;
}

export interface FileOptions {
  content?: string;
  replaces?: ReplaceOptions[];
  copy?: string;
  contentFromFile?: string;
  saveOnContentChanges?: boolean;
  appendRatherThanOverwrite?: boolean;
}

export interface FolderOptions {
  action?: ActionType;
}

export interface CloneOptions {
  from: string;
  to: string;
  removePreviousFolder?: boolean;
}

export interface CurlOptions {
  method?: string;
  headers?: { [key: string]: string };
  url: string;
  to: string;
}
