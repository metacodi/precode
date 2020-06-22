import * as ts from 'typescript';

import { DeploymentOptions } from '../../projects/types';
import { AngularDeployment } from './angular-deployment';
import { IonicAngularProject } from '../../projects/ionic-angular-project';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `ionic-angular`.
 */
export abstract class IonicAngularDeployment extends AngularDeployment {

  project: IonicAngularProject;

  constructor(data?: { [key: string]: any; }, project?: IonicAngularProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

}
