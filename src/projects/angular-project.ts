import chalk from 'chalk'; // const chalk = require('chalk');
import ts from 'typescript';

import { Terminal, Resource, ResourceType } from '@metacodi/node-utils';

import { TypescriptProject } from './typescript-project';


/**
 * **Usage**
 *
 * ```typescript
 * #!/usr/bin/env node
 * /// <reference types="node" />
 *
 * import { AngularProject } from '@metacodi/precode';
 * import Prompt from 'commander';
 *
 * Prompt.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.');
 * Prompt.parse(process.argv);
 *
 * const project = new AngularProject(Prompt.directory);
 * project.initialize().then(async () => {
 *   // ...
 * });
 * ```
 */
export class AngularProject extends TypescriptProject {

  /** Referència al contingut de l'arxiu `angular.json`. */
  angular: any;

  /** Comprova si la carpeta indicada és l'arrel d'un projecte de tipus Typescript. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprova si existeix l'arxiu de configuració del projecte.
    return TypescriptProject.isProjectFolder(folder)
      && !!resources.find(d => d.name === 'tsconfig.json')
      && !!resources.find(d => d.name === 'angular.json')
      // && this.testDependency('@angular/core', { echo: false })
    ;
  }

  /** Instal·la tot el necessari per crear un projecte d'aquest tipus a la carpeta indicada. */
  static createProject(folder?: string) {

  }


  // --------------------------------------------------------------------------------
  //  constructor . initialize
  // --------------------------------------------------------------------------------

  constructor(folder?: string) { super(folder); }

  /**
   * Inicialitza el projecte:
   * - Comprova que la carpeta indicada és una *carpeta de projecte*.
   * - Carrega els arxius de configuració `angular.ts`.
   */
  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        super.initialize().then(value => {

          // Is Project directory
          if (!TypescriptProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte ${chalk.bold('angular typescript')}`); }

          // Config files.
          Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('angular.json'))} de configuració...`);
          this.angular = Resource.open(this.rootPath('angular.json'));

          resolve(true);

        }).catch(error => reject(error));
      } catch (error) {
        Terminal.error(error);
        reject(error);
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  Abstract Syntax Tree
  // --------------------------------------------------------------------------------

  /** Devuelve una de las propiedades `imports`, `providers`, `entryComponents` o `declarations` del decorador de clase `@NgModule`. */
  getNgModuleProperty(classe: ts.ClassDeclaration, propName: string, throwError = true): ts.PropertyAssignment {
    const deco = classe.decorators.find(d => ((d.expression  as ts.CallExpression).expression as ts.Identifier).text === 'NgModule');
    if (!deco) {
      if (throwError) { Terminal.error(`No s'ha trobat el decorador de classe '${chalk.bold('@NgModule')}'.`, false); }
      return undefined;
    }
    const obj = (deco.expression  as ts.CallExpression).arguments[0] as ts.ObjectLiteralExpression;
    const prop = obj.properties.find((p: ts.Node) => (p as ts.PropertyAssignment).name.getText() === propName) as ts.PropertyAssignment;
    if (!prop) {
      if (throwError) { Terminal.error(`No s'ha trobat la propietat '${chalk.bold(propName)}' al decorador de classe '${chalk.bold('@NgModule')}'.`, false); }
      return undefined;
    }
    return prop;
  }

  // /** Comprova una propietat del decorador. */
  // testNgModuleProperty(prop: ts.PropertyAssignment, module: string, test: ((i: ts.Expression) => boolean), options?: DeploymentOptions): boolean {
  //   options = CodeDeployment.extendOptions(options);

  //   const value = prop.initializer as ts.ArrayLiteralExpression;

  //   if (!value.elements.find(i => test(i))) {
  //     if (options.echo) { Terminal.fail(`Falta la importació ${chalk.bold(module)} al decorador ${chalk.bold('@NgModule')}.`); }
  //     return false;
  //   } else {
  //     if (options.echo && options.verbose) { Terminal.success(`Importació ${chalk.bold(module)} al decorador ${chalk.bold('@NgModule')}.`); }
  //     return true;
  //   }

  // }

}
