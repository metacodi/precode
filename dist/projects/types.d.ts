#!/usr/bin/env node
import * as ts from 'typescript';
import { TextReplacer } from '../utils/text-replacer';
export declare type EditActionType = 'add' | 'remove';
export declare type ProjectType = 'typescript' | 'angular' | 'php';
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
    install?: string;
    uninstall?: string;
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
export declare type DeploymentType = CustomDeploymentType | FileExistsType | AngularNgModuleType | TypescriptDependencyType | TypescriptImportType | TypescriptConstructorType;
export interface DeploymentOptions {
    onlyTest?: boolean;
    resolveOnFail?: boolean;
    echo?: boolean;
    verbose?: boolean;
}
export interface ReplaceOptions {
    description?: string;
    global?: boolean;
    insensitive?: boolean;
    match?: string | RegExp;
    replace?: string | ((source: any, replacer: TextReplacer) => void);
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
    headers?: {
        [key: string]: string;
    };
    url: string;
    to: string;
    token?: string;
}
export declare type TypescriptModifierType = 'private' | 'protected' | 'public';
export interface TypescriptConstructorParameter {
    modifier: TypescriptModifierType;
    name: string;
    type: string;
    action: EditActionType;
}
//# sourceMappingURL=types.d.ts.map