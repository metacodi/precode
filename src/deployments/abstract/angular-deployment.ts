import { DeploymentOptions } from '../../projects/types';
import { TypescriptDeployment } from './typescript-deployment';
import { AngularProject } from '../../projects/angular-project';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `angular-typescript`.
 */
export abstract class AngularDeployment extends TypescriptDeployment {

  project: AngularProject;

  constructor(data?: { [key: string]: any; }, project?: AngularProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

}
