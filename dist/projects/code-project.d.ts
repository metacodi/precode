#!/usr/bin/env node
import * as mysql from 'mysql2';
import { FileOptions, FolderOptions, CloneOptions, CurlOptions } from './types';
export declare class CodeProject {
    name: string;
    projectPath: string;
    config: any;
    connection: mysql.Connection | mysql.PoolConnection;
    static curl(options: CurlOptions): Promise<string>;
    static execute(command: string): Promise<any>;
    static install(folder: string, dependencies: any[]): Promise<any>;
    constructor(projectPath: string);
    initialize(): Promise<any>;
    install(dependencies: any[]): Promise<any>;
    read(fileName: string, fromPath?: 'project' | 'script'): Promise<string>;
    file(fileName: string, options?: FileOptions): Promise<string>;
    exists(fileName: string): boolean;
    protected replaces(fileName: string, options: FileOptions): string;
    folder(folderName: string, options?: FolderOptions): Promise<any>;
    clone(options: CloneOptions): Promise<any>;
    curl(options: CurlOptions): Promise<string>;
    move(fromPath: string, toPath: string): Promise<any>;
    remove(name: string): Promise<any>;
    execute(command: string): Promise<any>;
    rootPath(fileName: string, folder?: string): string;
    relativePath(fileName: string): string;
    connect(config: mysql.PoolOptions): Promise<mysql.Connection | mysql.PoolConnection>;
    query(sql: string, data?: any): Promise<any>;
    closeConnection(): Promise<void>;
}
//# sourceMappingURL=code-project.d.ts.map