import { DeploymentOptions } from '../../../../projects/types';
import { TypescriptProject } from '../../../../projects/typescript-project';
import { TypescriptDeployment } from '../../../abstract/typescript-deployment';
export declare class CalendarCordova extends TypescriptDeployment {
    title: string;
    readme: string;
    constructor(data?: {
        [key: string]: any;
    }, project?: TypescriptProject, options?: DeploymentOptions);
    deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=calendar-cordova.d.ts.map