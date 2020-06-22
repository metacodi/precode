import * as ts from 'typescript';

import { CodeDeployment } from './code-deployment';
import { TypescriptProject } from '../../projects/typescript-project';
import { DeploymentOptions } from '../../projects/types';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `typescript`.
 */
export abstract class TypescriptDeployment extends CodeDeployment {

  project: TypescriptProject;

  constructor(data?: { [key: string]: any; }, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

}
