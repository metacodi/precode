import { CodeProject } from './code-project';
import ts from 'typescript';
import { FileOptions, TypescriptImportType } from './types';
export declare class TypescriptProject extends CodeProject {
    tsconfig: any;
    package: any;
    static isProjectFolder(folder: string): boolean;
    static createProject(folder: string): void;
    constructor(folder?: string);
    initialize(): Promise<boolean>;
    incrementPackageVersion(): void;
    hasDependency(name: string, type?: '--save-prod' | '--save-dev'): boolean;
    isCapacitorElectron(): boolean;
    isCapacitoriOS(): boolean;
    isCapacitorAndroid(): boolean;
    fileImports(fileName: string, imports: TypescriptImportType[], fileContent?: string): string;
    getImports(sourceFile: ts.SourceFile): {
        imports: any[];
        from: string;
        pos: number;
        end: number;
    }[];
    protected replaces(fileName: string, options: FileOptions): string;
    getSourceFile(fileName: string, content?: string): ts.SourceFile;
    findClassDeclaration(name: string, source: string | ts.SourceFile, throwError?: boolean): ts.ClassDeclaration;
    saveSourceFile(fileName: string, content: string): void;
    private normalizeObjectLiteral;
    aplyReplacements(content: string, replacements: any[]): string;
}
//# sourceMappingURL=typescript-project.d.ts.map