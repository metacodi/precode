#!/usr/bin/env node
import * as ts from 'typescript';
import { TextReplacement, TextReplacer } from './text-replacer';

export type ModifierType = 'private' | 'protected' | 'public';

export type ActionType = 'add' | 'remove';

export interface FileImport {
  specifiers: string[];
  source: string;
  action?: ActionType;
}

export interface ConstructorDeclaration {
  modifier: ModifierType;
  variable: string;
  specifier: string;
  action: ActionType;
}

export interface FindReplaceOptions {
  /** Si se establece se utiliza como condición previa para iniciar la sustitución. */
  contains?: string | RegExp;
  match?: string | RegExp;
  // replace?: string | (() => string);
  replace?: string | ((file: ts.SourceFile, replacer: TextReplacer) => void);
  global?: boolean;
  insensitive?: boolean;
  description?: string;
}

export interface FileOptions {
  imports?: FileImport[];
  construct?: ConstructorDeclaration[];
  // replaces?: ( FindReplaceOptions | ((content: string, file: ProjectFile) => string) )[];
  // replaces?: ( FindReplaceOptions | ((file: ProjectFile) => string) )[];
  replaces?: FindReplaceOptions[];
  copy?: string;
  content?: string;
  source?: ts.SourceFile;
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

export interface CodeProjectConfig {
  app: { name: string; package: string; };
  api?: { url: { dev: string; pro: string; }, version?: string };
  git?: { url: string; token?: string; };
  dependencies?: ProjectDependency[];
}

export interface ProjectDependency {
  name: string;
  url: string;
  dependencies: ProjectDependency[];
}

export interface PropertyValue {
  name: string;
  value: string;
}

