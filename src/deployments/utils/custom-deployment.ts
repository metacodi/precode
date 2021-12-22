import chalk from 'chalk';
import path from 'path';
import ts from 'typescript';

import { Terminal } from '../../utils/terminal';
import { Resource } from '../../utils/resource';

import { CodeDeployment } from '../abstract/code-deployment';
import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions, CustomDeploymentType } from '../../projects/types';
import { TextReplacer } from '../../utils/text-replacer';

/** Executa una funció personalitzada contra un arxiu de codi del projecte. */
export class CustomDeployment extends CodeDeployment {

  data: CustomDeploymentType;

  constructor(data?: CustomDeploymentType, project?: CodeProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: CodeProject, options?: DeploymentOptions, data?: CustomDeploymentType): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const fn = data.fn;
      const description = data.description;
      const args = data.arguments || [];

      if (typeof fn !== 'function') {
        Terminal.error(`No s'ha suministrat cap funció vàlida pel desplegament de codi.`);
        resolve(false);

      } else {
        Terminal.success(description ? description : `Executant funció personalitzada.`);
        Terminal.indent += 1;
        const result = await fn(...args);
        Terminal.indent -= 1;
        resolve(result);
      }

    });
  }

}
