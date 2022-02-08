import { TypescriptProject } from '../../projects/typescript-project';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { DeploymentOptions, TypescriptImportType } from '../../projects/types';
export declare class TypescriptImport extends TypescriptDeployment {
    constructor(data?: TypescriptImportType, project?: TypescriptProject, options?: DeploymentOptions);
    deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=typescript-import.d.ts.map