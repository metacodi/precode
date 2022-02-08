import { DeploymentOptions, AngularNgModuleType } from '../../projects/types';
import { AngularProject } from '../../projects/angular-project';
import { AngularDeployment } from '../abstract/angular-deployment';
export declare class AngularNgModule extends AngularDeployment {
    constructor(data?: AngularNgModuleType, project?: AngularProject, options?: DeploymentOptions);
    deploy(project?: AngularProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=ngModule.d.ts.map