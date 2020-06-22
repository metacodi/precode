import chalk from 'chalk';

import { CodeDeployment } from '../abstract/code-deployment';
import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions } from '../../projects/types';
import { Terminal } from '../../utils/terminal';
import { Resource } from '../../utils/resource';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `typescript`.
 */
export class FileExists extends CodeDeployment {

  constructor(data?: { [key: string]: any; }, project?: CodeProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: CodeProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const fileName = data.fileName;
      const help = data.help;

      if (!Resource.isAccessible(fileName)) {
        if (options.echo) { Terminal.fail(`Falta l'arxiu ${Terminal.file(fileName)}.`); }
        if (!options.onlyTest && !!help) { Terminal.log(help); }
        resolve(false);

      } else {
        if (options.echo) { Terminal.success(`Existeix l'arxiu ${Terminal.file(fileName)}.`); }
        resolve(true);
      }
    });
  }
}
