import { IonicAngularDeployment } from '../../abstract/ionic-angular-deployment';
import { IonicAngularProject } from '../../../projects/ionic-angular-project';
import { DeploymentOptions } from '../../../projects/types';
export declare class IonicAngularAppCore extends IonicAngularDeployment {
    title: string;
    project: IonicAngularProject;
    static deploy(project: IonicAngularProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
    constructor(data?: {
        [key: string]: any;
    }, project?: IonicAngularProject, options?: DeploymentOptions);
    deploy(project?: IonicAngularProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=ionic-angular-app-core.d.ts.map