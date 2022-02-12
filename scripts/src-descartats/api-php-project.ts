import chalk from 'chalk';
// import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import php, { Program, Node } from 'php-parser';

import { Terminal } from '../../src/utils/terminal';
import { Resource, ResourceType } from '../../src/utils/resource';
import { TextReplacer } from '../../src/utils/text-replacer';

import { PhpProject } from '../../scripts/php-project';
import { CodeDeployment } from '../../src/deployments/abstract/code-deployment';
import Engine from 'php-parser';


/** Projecte de codi PHP. */
export class ApiPhpProject extends PhpProject {

  /** Comprova si la carpeta indicada és l'arrel d'un projecte de tipus Typescript. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprova si existeix l'arxiu de configuració del projecte.
    return !!resources.find(d => d.name === 'api.php')
      && !!resources.find(d => d.name === 'api.json')
      && !!resources.find(d => d.name === 'rest.php')
    ;
  }

  /** Instal·la tot el necessari per crear un projecte d'aquest tipus a la carpeta indicada. */
  static createProject(folder: string) {
    // TODO: Clone Api Rest project.
  }


  // --------------------------------------------------------------------------------
  //  constructor . initialize
  // --------------------------------------------------------------------------------

  constructor(folder: string) { super(folder); }

  /**
   * Inicialitza el projecte:
   * - Comprova que la carpeta indicada és una *carpeta de projecte*.
   * - Carrega els arxius de configuració `tsconfig.ts` i `package.json`.
   * - Parseja els arxius per extreure info com per exemple el *nom del projecte*, etc.
   */
  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        super.initialize().then(value => {
          // Is Project directory
          if (!PhpProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte ${chalk.bold('api php')}`); }

          resolve(true);

        }).catch(error => reject(error));
      } catch (error) {
        Terminal.error(error);
        reject(error);
      }
    });
  }

}
