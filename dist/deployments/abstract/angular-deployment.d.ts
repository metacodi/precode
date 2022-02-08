import { DeploymentOptions } from '../../projects/types';
import { TypescriptDeployment } from './typescript-deployment';
import { AngularProject } from '../../projects/angular-project';
export declare abstract class AngularDeployment extends TypescriptDeployment {
    project: AngularProject;
    constructor(data?: {
        [key: string]: any;
    }, project?: AngularProject, options?: DeploymentOptions);
}
//# sourceMappingURL=angular-deployment.d.ts.map