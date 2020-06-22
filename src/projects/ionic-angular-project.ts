import chalk from 'chalk'; // const chalk = require('chalk');
import * as path from 'path';

import { Terminal } from '../utils/terminal';
import { Resource, ResourceType } from '../utils/resource';

import { CodeProject } from './code-project';
import { AngularProject } from './angular-project';


/**
 * **Usage**
 *
 * ```typescript
 * #!/usr/bin/env node
 * /// <reference types="node" />
 *
 * import { IonicAngularProject } from '@metacodi/precode';
 * import Prompt from 'commander';
 *
 * Prompt.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.');
 * Prompt.parse(process.argv);
 *
 * const project = new IonicAngularProject(Prompt.directory);
 * project.initialize().then(async () => {
 *   // ...
 * });
 * ```
 */
export class IonicAngularProject extends AngularProject {

  /** Referència al contingut de l'arxiu `ionic.config.json`. */
  ionic: any;

  /** Comprova si la carpeta indicada és l'arrel d'un projecte d'aquest tipus. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprova si existeix l'arxiu de configuració del projecte.
    return AngularProject.isProjectFolder(folder)
      && !!resources.find(d => d.name === 'tsconfig.json')
      && !!resources.find(d => d.name === 'angular.json')
      && !!resources.find(d => d.name === 'ionic.config.json')
      // && this.testDependency('@angular/core', { echo: false })
    ;
  }

  /** Instal·la tot el necessari per crear un projecte d'aquest tipus a la carpeta indicada. */
  static createProject(folder?: string) {
    const projectName = path.basename(folder);
    CodeProject.install(folder, [`ionic start ${projectName}`]);
  }


  // --------------------------------------------------------------------------------
  //  constructor . initialize
  // --------------------------------------------------------------------------------

  constructor(folder: string) { super(folder); }

  /**
   * Inicialitza el projecte:
   * - Comprova que la carpeta indicada és una *carpeta de projecte*.
   * - Carrega els arxius de configuració `ionic.config.ts`.
   */
  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        super.initialize().then(value => {

          // Is Project directory
          if (!AngularProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte ${chalk.bold('ionic angular')}`); }

          // Config files.
          Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('ionic.config.json'))} de configuració...`);
          this.ionic = Resource.open(this.rootPath('ionic.config.json'));

          resolve(true);

        }).catch(error => reject(error));
      } catch (error) {
        Terminal.error(error);
        reject(error);
      }
    });
  }

}
