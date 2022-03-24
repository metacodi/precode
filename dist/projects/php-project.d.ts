import { Program, Node } from 'php-parser';
import { CodeProject } from '../projects/code-project';
export declare class PhpProject extends CodeProject {
    static isProjectFolder(folder: string): boolean;
    static createProject(folder: string): void;
    constructor(folder?: string);
    initialize(): Promise<boolean>;
    getSourceFile(fileName: string, content?: string): Program;
    findClassDeclaration(name: string, source: any, throwError?: boolean): Node;
}
//# sourceMappingURL=php-project.d.ts.map