#!/usr/bin/env node
import * as ts from 'typescript';
import { TextReplacer } from '../utils/text-replacer';


// --------------------------------------------------------------------------------
//  General
// --------------------------------------------------------------------------------

export type EditActionType = 'add' | 'remove';

export type ProjectType = 'typescript' | 'angular' | 'php';


// --------------------------------------------------------------------------------
//  Deployments
// --------------------------------------------------------------------------------

export interface TypescriptDependencyType {
  install?: string;
  uninstall?: string;
  type?: '--save-dev' | '--save';
}

export interface TypescriptImportType {
  file?: ts.SourceFile;
  import: string;
  from: string;
  action?: EditActionType;
}

export interface AngularNgModuleType {
  file?: ts.SourceFile;
  ngModule: string;
  property: string;
  element: string;
  test?: (e: any) => boolean;
  text?: string;
}

export interface DeploymentOptions {
  onlyTest?: boolean;
  resolveOnFail?: boolean;
  echo?: boolean;
  verbose?: boolean;
}

export type DeploymentType = TypescriptDependencyType | TypescriptImportType | AngularNgModuleType;


// --------------------------------------------------------------------------------
//  Scripting tasks
// --------------------------------------------------------------------------------

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
  action?: EditActionType;
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


// --------------------------------------------------------------------------------
//  Typescript
// --------------------------------------------------------------------------------

export type TypescriptModifierType = 'private' | 'protected' | 'public';

export interface TypescriptConstructorParameter {
  modifier: TypescriptModifierType;
  name: string;
  type: string;
  action: EditActionType;
}
