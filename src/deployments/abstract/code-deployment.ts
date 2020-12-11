import chalk from 'chalk';

import { Terminal } from '../../utils/terminal';

import { CodeProject } from '../../projects/code-project';
import { DeploymentOptions } from '../../projects/types';


/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi.
 */
export abstract class CodeDeployment {

  /** Títol del procés de desplegament de codi. */
  title: string;
  /** Url per accedir a l'ajuda. */
  readme: string;

  /** Referència al projecte principal on es desplegarà el codi implementat. */
  project: CodeProject;
  /** Opcions per parametritzar el desplegament de codi. */
  options: DeploymentOptions;
  /** Dades suplementàries necessàries per aquest desplegament de codi. */
  data: { [key: string]: any; };

  // /** @experimental Desplegaments de codi que s'executaran com a part d'aquest però abans de les tasques propies. */
  // preRequisites: CodeDeployment[];

  /** Inicializa l'argument `options` amb només aquelles propietats que falten per definir. */
  static extendOptions(options?: DeploymentOptions): DeploymentOptions {
    if (!options) { options = {}; }
    if (options.onlyTest === undefined) { options.onlyTest = true; }
    if (options.resolveOnFail === undefined) { options.resolveOnFail = true; }
    if (options.echo === undefined) { options.echo = true; }
    if (options.verbose === undefined) { options.verbose = false; }
    return options;
  }

  constructor(data?: { [key: string]: any; }, project?: CodeProject, options?: DeploymentOptions) {
    this.project = project;
    this.options = options;
    this.data = data;
  }

  /**
   * Executa el desplegament de codi en el projecte.
   * @param project Si no s'indica un projecte aleshores s'utilitza la referència obtinguda pel constructor.
   */
  abstract async deploy(project?: CodeProject, options?: DeploymentOptions, data?: { [key: string]: any }): Promise<boolean>;

  /** Executa les tasques de desplegament de codi. */
  async run(tasks: any[], project?: CodeProject, options?: DeploymentOptions): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      const { echo, verbose, resolveOnFail } = options;
      if (!project) { project = this.project; }

      for (const task of tasks) {
        if (typeof task.deploy === 'function') {
          const result = await task.deploy(project, options);
          if (!result && resolveOnFail) { resolve(false); return; }

        } else {
          Terminal.error(`No es reconeix la tasca com un desplegament de codi vàlid.`);
          console.log(chalk.red(task));
        }
      }
      resolve(true);
    });
  }

}
