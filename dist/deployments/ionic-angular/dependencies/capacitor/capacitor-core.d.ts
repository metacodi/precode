import { TypescriptProject } from '../../../../projects/typescript-project';
import { TypescriptDeployment } from '../../../abstract/typescript-deployment';
import { DeploymentOptions } from '../../../../projects/types';
export declare class CapacitorCore extends TypescriptDeployment {
    constructor(data?: {
        [key: string]: any;
    }, project?: TypescriptProject, options?: DeploymentOptions);
    deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=capacitor-core.d.ts.map