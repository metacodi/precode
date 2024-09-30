import { AngularProject } from './angular-project';
import { IonicProjectOptions } from './types';
export declare class IonicAngularProject extends AngularProject {
    ionic: any;
    static isProjectFolder(folder: string): boolean;
    static createProject(folder?: string, options?: IonicProjectOptions): void;
    constructor(folder?: string);
    initialize(): Promise<boolean>;
    sanitizeEntity(entity: string): string;
    generateSchema(folder: string, entity: {
        singular: string;
        plural: string;
    }): Promise<any>;
    generateService(folder: string, entity: {
        singular: string;
        plural: string;
    }): Promise<any>;
    generateModule(folder: string, entity: {
        singular: string;
        plural: string;
    }): Promise<any>;
    generateListPage(folder: string, entity: {
        singular: string;
        plural: string;
    }): Promise<any>;
    generateListComponent(folder: string, entity: {
        singular: string;
        plural: string;
    }): Promise<any>;
    generateDetailPage(folder: string, entity: {
        singular: string;
        plural: string;
    }): Promise<any>;
}
//# sourceMappingURL=ionic-angular-project.d.ts.map