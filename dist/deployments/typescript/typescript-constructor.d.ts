import { TypescriptProject } from '../../projects/typescript-project';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { DeploymentOptions, TypescriptConstructorType } from '../../projects/types';
export declare class TypescriptConstructor extends TypescriptDeployment {
    constructor(data?: TypescriptConstructorType, project?: TypescriptProject, options?: DeploymentOptions);
    deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=typescript-constructor.d.ts.map