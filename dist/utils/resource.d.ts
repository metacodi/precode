/// <reference types="node" />
import * as fs from 'fs';
import { FilterPatternType } from './functions';
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
export declare class Resource {
    static concat(folder: string, fileName: string): string;
    static normalize(fileName: string): string;
    static split(value: string): string[];
    static join(values: string[]): string;
    static get platformPathSeparator(): string;
    static open(fileName: string, options?: {
        parseJsonFile?: boolean;
        wrapAsArray?: boolean;
    }): any;
    static save(fileName: string, content: any, options?: fs.WriteFileOptions): boolean;
    static exists(resource: string): boolean;
    static isAccessible(resource: string): boolean;
    static isReadable(resource: string): boolean;
    static isWriteable(resource: string): boolean;
    static isReadOnly(resource: string): boolean;
    static discover(resource: string, options?: {
        ignore?: FilterPatternType;
        filter?: FilterPatternType;
        recursive?: boolean;
    }, indent?: string): ResourceType | ResourceType[];
    static copy(source: string, target: string, options?: {
        filter?: FilterPatternType;
        createFolderInTarget?: boolean;
        verbose?: boolean;
    }): void;
    static copyFileSync(source: any, target: any, options?: {
        verbose?: boolean;
    }, indent?: string): void;
    static copyFolderSync(source: any, target: any, options?: {
        filter?: FilterPatternType;
        createFolderInTarget?: boolean;
        verbose?: boolean;
    }, indent?: string): number;
    static hasFilteredFiles(folder: string, filter?: FilterPatternType): boolean;
}
//# sourceMappingURL=resource.d.ts.map