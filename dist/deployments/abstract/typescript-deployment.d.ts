import { CodeDeployment } from './code-deployment';
import { TypescriptProject } from '../../projects/typescript-project';
import { DeploymentOptions } from '../../projects/types';
export declare abstract class TypescriptDeployment extends CodeDeployment {
    project: TypescriptProject;
    constructor(data?: {
        [key: string]: any;
    }, project?: TypescriptProject, options?: DeploymentOptions);
}
//# sourceMappingURL=typescript-deployment.d.ts.map