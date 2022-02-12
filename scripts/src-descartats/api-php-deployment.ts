import { DeploymentOptions } from '../../src/projects/types';
import { CodeDeployment } from '../../src/deployments/abstract/code-deployment';
import { PhpDeployment } from './php-deployment';
import { PhpProject } from '../../../scripts/php-project';
import { ApiPhpProject } from './api-php-project';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `php`.
 */
export abstract class ApiPhpDeployment extends PhpDeployment {

  project: ApiPhpProject;

  constructor(data?: { [key: string]: any; }, project?: ApiPhpProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

}
