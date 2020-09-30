import chalk from 'chalk'; // const chalk = require('chalk');
import * as path from 'path';

import { Terminal } from '../utils/terminal';
import { Resource, ResourceType } from '../utils/resource';

import { CodeProject } from './code-project';
import { AngularProject } from './angular-project';
import { capitalize } from '../utils/functions';
import { detailPageHtml, detailPageTs, listComponentHtml, listComponentScss, listComponentTs, listPageHtmlContent, listPageTsContent, moduleContent, schemaContent, serviceContent } from '../deployments/ionic-angular/resources/generate/generate';



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

  // --------------------------------------------------------------------------------
  //  content
  // --------------------------------------------------------------------------------




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



  // --------------------------------------------------------------------------------
  //  generate abstract components, module and service
  // --------------------------------------------------------------------------------

  async generateSchema(folder: string, entity: { singular: string, plural: string }): Promise<any> {
    const fileName = `${folder}\\${entity.plural}.schema`;
    await this.folder(folder);
    await this.file(`${fileName}.ts`, { content: schemaContent, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
      { match: '{{entityName}}', replace: entity.plural.substring(0, entity.plural.length - 1) === entity.singular
        ? `'${entity.plural}'`
        : `{ singular: '${entity.singular}', plural: '${entity.plural}' }`
      },
    ] });
  }

  async generateService(folder: string, entity: { singular: string, plural: string }): Promise<any> {
    const fileName = `${folder}\\${entity.plural}.service.ts`;
    await this.folder(folder);
    await this.file(fileName, { content: serviceContent, replaces: [
      { match: '{{entityPlural}}', replace: capitalize(entity.plural) }
    ] });
  }

  async generateModule(folder: string, entity: { singular: string, plural: string }): Promise<any> {
    const fileName = `${folder}\\${entity.plural}.module.ts`;
    await this.folder(folder);
    await this.file(fileName, { content: moduleContent, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
      { match: '{{entityPlural}}', replace: entity.plural },
      { match: '{{EntitySingular}}', replace: capitalize(entity.singular) },
      { match: '{{entitySingular}}', replace: entity.singular },
    ] });
  }

  async generateListPage(folder: string, entity: { singular: string, plural: string }): Promise<any> {
    const fileName = `${folder}\\${entity.plural}-list.page`;
    await this.folder(folder);
    await this.file(`${fileName}.ts`, { content: listPageTsContent, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
      { match: '{{entityPlural}}', replace: entity.plural },
    ] });
    await this.file(`${fileName}.scss`);
    await this.file(`${fileName}.html`, { content: listPageHtmlContent, replaces: [
      { match: '{{entityPlural}}', replace: entity.plural },
    ] });

  }

  async generateListComponent(folder: string, entity: { singular: string, plural: string }): Promise<any> {
    const fileName = `${folder}\\${entity.plural}-list.component`;
    await this.folder(folder);
    await this.file(`${fileName}.ts`, { content: listComponentTs, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
      { match: '{{entityPlural}}', replace: entity.plural },
    ] });
    await this.file(`${fileName}.scss`, { content: listComponentScss });
    await this.file(`${fileName}.html`, { content: listComponentHtml, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
    ] });

  }

  async generateDetailPage(folder: string, entity: { singular: string, plural: string }): Promise<any> {
    const fileName = `${folder}\\${entity.singular}-detail.page`;
    await this.folder(folder);
    await this.file(`${fileName}.ts`, { content: detailPageTs, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
      { match: '{{entityPlural}}', replace: entity.plural },
      { match: '{{EntitySingular}}', replace: capitalize(entity.singular) },
      { match: '{{entitySingular}}', replace: entity.singular },
    ] });
    await this.file(`${fileName}.scss`);
    await this.file(`${fileName}.html`, { content: detailPageHtml, replaces: [
      { match: '{{EntityPlural}}', replace: capitalize(entity.plural) },
      { match: '{{entityPlural}}', replace: entity.plural },
    ] });

  }
}


