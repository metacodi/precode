import { CodeDeployment } from '../abstract/code-deployment';
import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions, FileExistsType } from '../../projects/types';
export declare class FileExists extends CodeDeployment {
    constructor(data?: FileExistsType, project?: CodeProject, options?: DeploymentOptions);
    deploy(project?: CodeProject, options?: DeploymentOptions, data?: {
        [key: string]: any;
    }): Promise<boolean>;
}
//# sourceMappingURL=file-exists.d.ts.map