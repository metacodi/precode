import chalk from 'chalk';
import { Terminal } from './utils/terminal';
import { TypescriptProject } from './typescript-project';
import { TestOptions } from './typescript-project-types';


/**
 * Classe abstracta que s'utilitza per definir un procés de desplagament de codi.
 */
export abstract class CodeDeployment {

  /** Títol del procés de desplegament de codi. */
  abstract title: string;
  /** Referència al projecte principal on es desplegarà el codi implementat. */
  readonly project: TypescriptProject;

  /** Inicializa l'argument `options` a les funcions de test. */
  static defaultTestOptions(options?: TestOptions): TestOptions {
    if (!options) { options = {}; }
    if (options.resolveOnFail === undefined) { options.resolveOnFail = true; }
    if (options.echo === undefined) { options.echo = true; }
    if (options.verbose === undefined) { options.verbose = false; }
    return options;
  }

  constructor(project: TypescriptProject) {
    this.project = project;
  }

  /**
   * Executa el desplegament de codi en el projecte.
   * @param project Si no s'indica un projecte aleshores s'utilitza la referència obtinguda pel constructor.
   */
  abstract async deploy(project?: TypescriptProject): Promise<boolean>;

  /**
   * Comprova si el desplegament de codi ja ha estat realitzat en el projecte.
   * @param project Si no s'indica un projecte aleshores s'utilitza la referència obtinguda pel constructor.
   */
  abstract async test(project?: TypescriptProject): Promise<boolean>;


}
