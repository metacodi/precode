#!/usr/bin/env node
import ts from 'typescript';
import { TextReplacer } from '../utils/text-replacer';


// --------------------------------------------------------------------------------
//  General
// --------------------------------------------------------------------------------

export type EditActionType = 'add' | 'remove';

export type ProjectType = 'typescript' | 'angular' | 'php';


// --------------------------------------------------------------------------------
//  Deployments
// --------------------------------------------------------------------------------

export interface CustomDeploymentType {
  fn: any;
  arguments?: any[];
  description?: string;
}

export interface FileExistsType {
  fileName: string;
  relativeTo?: string;
  help?: string;
}

export interface AngularNgModuleType {
  file?: ts.SourceFile;
  ngModule: string;
  property: string;
  element: string;
  test?: (e: any) => boolean;
  text?: string;
}

export interface TypescriptDependencyType {
  /**
   * Si s'indica el nom d'un package (ex: '@capacitor/core') es genera la instrucció `npm install @capacitor/core --save`.
   *
   * Tb. es pot indicar la url d'un repositori (ej: 'https://github.com/fabiorogeriosj/cordova-plugin-sensors.git'), i en aquest cas serà
   * necessari establir tb. la propietat `dependency` per indicar el nom del package i poder-ne comprovar l'estat d'instal·lació.
   */
  install?: string;
  uninstall?: string;
  /**
   * Utilitzem aquesta propietat quan el nom del package no coincideix amb el valor de la propietat `install` o `uninstall`.
   *
   * Per exemple:
   * ```bash
   * new TypescriptDependency({ install: 'https://github.com/fabiorogeriosj/cordova-plugin-sensors.git', dependency: 'cordova-plugin-sensors' }),
   * ```
   */
  dependency?: string;
  type?: '--save-dev' | '--save';
}

export interface TypescriptImportType {
  file?: ts.SourceFile;
  import: string;
  from: string;
  action?: EditActionType;
}

export interface TypescriptConstructorType {
  file: ts.SourceFile;
  class?: string;
  modifier?: string;
  identifier: string;
  type: string;
}


export type DeploymentType = CustomDeploymentType
  | FileExistsType
  | AngularNgModuleType
  | TypescriptDependencyType | TypescriptImportType | TypescriptConstructorType
;

export interface DeploymentOptions {
  onlyTest?: boolean;
  resolveOnFail?: boolean;
  echo?: boolean;
  verbose?: boolean;
}


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

/**
 * 
 * ```typescript
 * export interface FolderOptions {
 *   action?: EditActionType;
 * }
 * export type EditActionType = 'add' | 'remove';
 * ```
 * 
 */
export interface FolderOptions {
  action?: EditActionType;
}

export interface CloneOptions {
  from: string;
  to: string;
  removePreviousFolder?: boolean;
}

/**
 * ```typescript
 * export interface CurlOptions {
 *   method?: string;
 *   headers?: { [key: string]: string };
 *   url: string;
 *   to: string;
 *   token?: string;
 * }
 * ```
 */
export interface CurlOptions {
  method?: string;
  headers?: { [key: string]: string };
  url: string;
  to: string;
  token?: string;
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


// --------------------------------------------------------------------------------
//  Ionic
// --------------------------------------------------------------------------------

/**
 * ```typescript
 * export interface IonicProjectOptions {
 *   template?: IonicProjectTemplate;
 *   type?: IonicProjectType;
 *   withCordova?: boolean;
 *   withCapacitor?: boolean;
 * }
 * 
 * type IonicProjectTemplate = 'tabs' | 'sidemenu' | 'blank' | 'list' | 'my-first-app'
 * 
 * type IonicProjectType = 'vue' | 'angular' | 'angular-standalone' | 'react'
 * ```
 */
export interface IonicProjectOptions {
  /**
   * ```typescript
   * type IonicProjectTemplate = 'tabs' | 'sidemenu' | 'blank' | 'list' | 'my-first-app'
   * ```
   * @default 'blank'
   */
  template?: IonicProjectTemplate;
  /**
   * {@link https://ionicframework.com/docs/cli/commands/start#options Ionic start options}
   * 
   * ```typescript
   * type IonicProjectType = 'vue' | 'angular' | 'angular-standalone' | 'react'
   * ```
   * @default 'angular'
   */
  type?: IonicProjectType;
  /** @default false */
  withCordova?: boolean;
  /** @default false */
  withCapacitor?: boolean;
}

/** {@link https://ionicframework.com/docs/cli/commands/start#options ionic start} */
export type IonicProjectType = 'vue' | 'angular' | 'angular-standalone' | 'react';

/** Executar `ionic start --list` per obtenir un llista actualitzada de templates. */
export type IonicProjectTemplate =
  /** A starting project with a simple tabbed interface. */
  'tabs' |
  /** A starting project with a side menu with navigation in the content area. */
  'sidemenu' |
  /** A blank starter project. */
  'blank' |
  /** A starting project with a list. */
  'list' |
  /** A template for the "Build Your First App" tutorial. */
  'my-first-app'
;

