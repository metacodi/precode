import * as ts from 'typescript';
import { TypescriptProject } from './typescript-project';
export declare class AngularProject extends TypescriptProject {
    angular: any;
    static isProjectFolder(folder: string): boolean;
    static createProject(folder?: string): void;
    constructor(folder: string);
    initialize(): Promise<boolean>;
    getNgModuleProperty(classe: ts.ClassDeclaration, propName: string, throwError?: boolean): ts.PropertyAssignment;
}
//# sourceMappingURL=angular-project.d.ts.map