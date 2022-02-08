import { CodeDeployment } from '../abstract/code-deployment';
import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions, CustomDeploymentType } from '../../projects/types';
export declare class CustomDeployment extends CodeDeployment {
    data: CustomDeploymentType;
    constructor(data?: CustomDeploymentType, project?: CodeProject, options?: DeploymentOptions);
    deploy(project?: CodeProject, options?: DeploymentOptions, data?: CustomDeploymentType): Promise<boolean>;
}
//# sourceMappingURL=custom-deployment.d.ts.map