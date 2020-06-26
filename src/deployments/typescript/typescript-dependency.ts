import chalk from 'chalk';

import { CodeDeployment } from '../abstract/code-deployment';
import { TypescriptProject } from '../../projects/typescript-project';
import { DeploymentOptions, TypescriptDependencyType } from '../../projects/types';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { Terminal } from '../../utils/terminal';

/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi en projectes `typescript`.
 */
export class TypescriptDependency extends TypescriptDeployment {

  constructor(data?: TypescriptDependencyType, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const name = data.dependency || data.install || data.uninstall;
      const action = data.install ? 'install' : 'uninstall';
      const type = data.type === '--save-dev' || data.type === '-D' ? '--save-dev' : '--save';

      const has = project.hasDependency(name, type);

      if (action === 'install') {

        if (!has) {
          if (options.onlyTest) {
            if (options.echo) { Terminal.fail(`Falta la dependència ${chalk.bold(name)}.`); }
            resolve(false);

          } else {
            if (options.echo) { Terminal.success(`Instal·lant dependència ${chalk.bold(name)}...`); }
            await project.install([`npm ${action} ${name} ${type}`]);
            resolve(true);
          }

        } else {
          if (options.echo) { Terminal.success(`Dependència instal·lada ${chalk.bold(name)}.`); }
          resolve(true);
        }

      } else if (action === 'uninstall') {
        Terminal.error(`Not implemented ${chalk.bold('uninstall')} action for ${chalk.bold('TypescriptDependency')}`);
      }
    });
  }
}
