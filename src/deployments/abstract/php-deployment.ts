import { DeploymentOptions } from '../../projects/types';
import { CodeDeployment } from './code-deployment';
import { PhpProject } from '../../projects/php-project';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `php`.
 */
export abstract class PhpDeployment extends CodeDeployment {

  project: PhpProject;

  constructor(data?: { [key: string]: any; }, project?: PhpProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

}
