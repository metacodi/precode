import { DeploymentOptions } from '../../projects/types';
import { AngularProject } from '../../projects/angular-project';
import { AngularDeployment } from '../abstract/angular-deployment';
export declare class I18n extends AngularDeployment {
    title: string;
    project: AngularProject;
    constructor(data?: {
        [key: string]: any;
    }, project?: AngularProject, options?: DeploymentOptions);
    deploy(project?: AngularProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=i18n.d.ts.map