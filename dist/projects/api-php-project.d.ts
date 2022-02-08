import { PhpProject } from './php-project';
export declare class ApiPhpProject extends PhpProject {
    static isProjectFolder(folder: string): boolean;
    static createProject(folder: string): void;
    constructor(folder: string);
    initialize(): Promise<boolean>;
}
//# sourceMappingURL=api-php-project.d.ts.map