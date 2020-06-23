import { DeploymentOptions } from '../../projects/types';
import { CodeDeployment } from './code-deployment';
import { PhpDeployment } from './php-deployment';
import { PhpProject } from '../../projects/php-project';
import { ApiPhpProject } from '../../projects/api-php-project';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `php`.
 */
export abstract class ApiPhpDeployment extends PhpDeployment {

  project: ApiPhpProject;

  constructor(data?: { [key: string]: any; }, project?: ApiPhpProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

}
