import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import { CodeDeployment } from '../abstract/code-deployment';
import { TypescriptProject } from '../../projects/typescript-project';
import { ResourceType, Resource } from '../../utils/resource';
import { DeploymentOptions, AngularNgModuleType } from '../../projects/types';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { CodeProject } from '../../projects/code-project';
import { Terminal } from '../../utils/terminal';
import ts from 'typescript';
import { fstat } from 'fs';
import { AngularProject } from '../../projects/angular-project';
import { AngularDeployment } from '../abstract/angular-deployment';
import { TextReplacer } from '../../utils/text-replacer';

/** Afegeix una expressió de codi a una de les propietats del decorador `ngModule` de la classe indicada. */
export class AngularNgModule extends AngularDeployment {

  constructor(data?: AngularNgModuleType, project?: AngularProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: AngularProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const file: ts.SourceFile = project.getSourceFile(data.file.fileName);
      const ngModule: string = data.ngModule;
      const property: string = data.property;
      const element: string = data.element;
      const text: string = data.text || data.element;
      const test: (e: any) => boolean = data.test;

      const classe = project.findClassDeclaration(ngModule, file);
      const prop = project.getNgModuleProperty(classe, property);
      const value = prop.initializer as ts.ArrayLiteralExpression;

      if (!value.elements.find(e => test(e))) {
        if (options.onlyTest) {
          if (options.echo) { Terminal.fail(`Falta la importació ${chalk.bold(element)} al decorador ${chalk.bold('@NgModule')}.`); }
          resolve(false);

        } else {
          if (options.echo) { Terminal.success(`Afegint la importació ${chalk.bold(element)} al decorador ${chalk.bold('@NgModule')}...`); }
          // Insertem al final (end) retrocedint un caràcter per estar dins dels paréntesis (ej: '[]')
          const pos = value.end - 1;
          const comma = value.getText() === '[]' ? '' : ', ';
          const content = Resource.open(file.fileName);
          const replacer: TextReplacer = new TextReplacer(content);
          replacer.insert(pos, `${comma}${text}`);
          resolve(Resource.save(file.fileName, replacer.apply()));
        }

      } else {
        if (options.echo) { Terminal.success(`Importació correcta de ${chalk.bold(element)} al decorador ${chalk.bold('@NgModule')}.`); }
        resolve(true);
      }
    });
  }
}
