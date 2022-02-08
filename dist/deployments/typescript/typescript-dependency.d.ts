import { TypescriptProject } from '../../projects/typescript-project';
import { DeploymentOptions, TypescriptDependencyType } from '../../projects/types';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
export declare class TypescriptDependency extends TypescriptDeployment {
    constructor(data?: TypescriptDependencyType, project?: TypescriptProject, options?: DeploymentOptions);
    deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=typescript-dependency.d.ts.map