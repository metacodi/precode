import { DeploymentOptions } from '../../projects/types';
import { PhpDeployment } from './php-deployment';
import { ApiPhpProject } from '../../projects/api-php-project';
export declare abstract class ApiPhpDeployment extends PhpDeployment {
    project: ApiPhpProject;
    constructor(data?: {
        [key: string]: any;
    }, project?: ApiPhpProject, options?: DeploymentOptions);
}
//# sourceMappingURL=api-php-deployment.d.ts.map