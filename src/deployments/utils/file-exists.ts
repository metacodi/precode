import chalk from 'chalk';
import path from 'path';

import { Terminal, Resource, ResourceType } from '@metacodi/node-utils';

import { CodeDeployment } from '../abstract/code-deployment';
import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions, FileExistsType } from '../../projects/types';


/**
 * Classe de desplegament de codi de baix nivell que comproba si existeix u arxiu.
 */
export class FileExists extends CodeDeployment {

  constructor(data?: FileExistsType, project?: CodeProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: CodeProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const fullName = data.fileName;
      const relativeTo = data.relativeTo || project.projectPath || '';
      const fileName =  path.relative(relativeTo, fullName);
      const help = data.help;

      if (!Resource.isAccessible(fullName)) {
        if (options.echo) { Terminal.fail(`Falta l'arxiu ${Terminal.file(fileName, relativeTo)}.`); }
        if (help) { Terminal.log(help); }
        resolve(false);

      } else {
        if (options.echo) { Terminal.success(`Existeix l'arxiu ${Terminal.file(fileName, relativeTo)}.`); }
        resolve(true);
      }
    });
  }
}
