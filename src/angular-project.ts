import { CodeProject } from './code-project';
import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from '@ionic/utils-fs/dist/index.js';
import { TextReplacer } from './utils/text-replacer';
import { FileOptions, FolderOptions, CloneOptions, CurlOptions, ResourceType } from './code-project-types';
import { FileImport, TestOptions } from './typescript-project-types';
import { Terminal } from './utils/terminal';
import { Resource } from './utils/resource';
import { CodeDeployment } from './code-deployment';
import { TypescriptProject } from './typescript-project';


/**
 * **Usage**
 *
 * ```typescript
 * #!/usr/bin/env node
 * /// <reference types="node" />
 *
 * import { TypescriptProject } from '@metacodi/precode';
 * import Prompt from 'commander';
 *
 * Prompt.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.');
 * Prompt.parse(process.argv);
 *
 * const project: TypescriptProject = new TypescriptProject(Prompt.directory);
 * project.initialize().then(async () => {
 *   // Instal·la una dependència al projecte.
 *   await project.install([`npm i @types/node --save-dev`]);
 * });
 * ```
 */
export class AngularProject extends TypescriptProject {

  /** Referència al contingut de l'arxiu `tsconfig.json`. */
  tsconfig: any;
  /** Referència al contingut de l'arxiu `package.json`. */
  package: any;

  /** Comrpoba si la carpeta indicada és l'arrel d'un projecte de tipus Typescript. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprpovem si existeix l'arxiu de configuració del projecte.
    return TypescriptProject.isProjectFolder(folder)
      && !!resources.find(d => d.name === 'tsconfig.json')
      && !!resources.find(d => d.name === 'angular.json')
      && !!resources.find(d => d.name === 'angular.json')
    ;
  }

  constructor(folder: string) { super(folder); }

  /**
   * Inicialitza el projecte:
   * - Comproba que la carpeta indicada és una *carpeta de projecte*.
   * - Carrega els continguts del arxius de configuració `tsconfig.ts` i `package.json`.
   * - Parseja els arxius per extreure info com per exemple el *nom del projecte*, etc.
   */
  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        // Project directory
        if (!fs.existsSync(this.projectPath)) { Terminal.error(`No s'ha trobat la carpeta del projecte ${chalk.bold(this.projectPath)}`); reject(); }
        if (!TypescriptProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte typescript`); }
        Terminal.log(chalk.bold('Directori del projecte: ') + Terminal.file(this.projectPath));

        // Config files.
        Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('tsconfig.json'))} de configuració...`);
        this.tsconfig = Resource.openJson(this.rootPath('tsconfig.json'));
        Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('package.json'))} de configuració...`);
        this.package = Resource.openJson(this.rootPath('package.json'));

        // Nombre del proyecto.
        this.name = this.package && this.package.name ? this.package.name : '';

        resolve(true);

      } catch (error) {
        Terminal.error(error);
        reject();
      }
    });
  }

}
