import { DeploymentOptions } from '../../projects/types';
import { CodeDeployment } from './code-deployment';
import { PhpProject } from '../../projects/php-project';
export declare abstract class PhpDeployment extends CodeDeployment {
    project: PhpProject;
    constructor(data?: {
        [key: string]: any;
    }, project?: PhpProject, options?: DeploymentOptions);
}
//# sourceMappingURL=php-deployment.d.ts.map