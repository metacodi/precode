import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions } from '../../projects/types';
export declare abstract class CodeDeployment {
    title: string;
    readme: string;
    project: CodeProject;
    options: DeploymentOptions;
    data: {
        [key: string]: any;
    };
    static extendOptions(options?: DeploymentOptions): DeploymentOptions;
    constructor(data?: {
        [key: string]: any;
    }, project?: CodeProject, options?: DeploymentOptions);
    abstract deploy(project?: CodeProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
    run(tasks: any[], project?: CodeProject, options?: DeploymentOptions): Promise<boolean>;
}
//# sourceMappingURL=code-deployment.d.ts.map