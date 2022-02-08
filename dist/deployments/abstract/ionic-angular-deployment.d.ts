import { DeploymentOptions } from '../../projects/types';
import { AngularDeployment } from './angular-deployment';
import { IonicAngularProject } from '../../projects/ionic-angular-project';
export declare abstract class IonicAngularDeployment extends AngularDeployment {
    project: IonicAngularProject;
    constructor(data?: {
        [key: string]: any;
    }, project?: IonicAngularProject, options?: DeploymentOptions);
}
//# sourceMappingURL=ionic-angular-deployment.d.ts.map