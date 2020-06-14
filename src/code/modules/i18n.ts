#!/usr/bin/env node
/// <reference types="node" />

import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import { CodeProject, TextReplacer } from '../../code';

/**
 * Define como instalar un módulo de código en un proyecto.
 */
export interface ModuleInstallation {
  // name: string;
  // project: CodeProject;
  install(project: CodeProject): Promise<void>;
}

/**
 * i18n - Translate Module
 *
 * Instal·la el mòdul de traducció al projecte.
 * ```typescript
 * i18n.install(project);
 * ```
 */
// tslint:disable-next-line: class-name
export class i18n implements ModuleInstallation {

  public static title = 'i18n - Translate Module';

  public static async install(project: CodeProject): Promise<void> {

    console.log(project.line + '\n' + '  ' + chalk.blueBright(chalk.bold(i18n.title)) + '\n' + project.line);

    // await project.install([
    //   `npm install @ngx-translate/core --save`,
    //   `npm install @ngx-translate/http-loader --save`,
    // ]);

    // await project.folder('src/assets/i18n');
    // await project.file('src/assets/i18n/es.json', { contentFromFile: 'resources/i18n/es.json' });

    await project.file('src/app/app.module.ts', {
      imports: [
        { specifiers: [ 'TranslateModule', 'TranslateLoader' ], source: '@ngx-translate/core' },
        { specifiers: [ 'TranslateHttpLoader' ], source: '@ngx-translate/http-loader' },
        { specifiers: [ 'HttpClientModule', 'HttpClient' ], source: '@angular/common/http' },
      ],
      replaces: [{
        description: `Afegint importacions ${chalk.bold('HttpClientModule, TranslateModule')} al decorador '${chalk.bold('@NgModule')}'...`,
        replace: (file: ts.SourceFile, replacer: TextReplacer) => {
          const classe = project.getClassDeclaration('AppModule', file.statements);
          const prop = project.getNgModuleProperty(classe, 'imports');
          const value = prop.initializer as ts.ArrayLiteralExpression;
          // Insertem al final (end) retrocedint un caràcter per estar dins dels paréntesis (ej: '[]')
          const pos = value.end - 1;

          if (!value.elements.find(i => i.getText() === 'HttpClientModule')) {
            const priority = 1;
            const comma = value.getText() === '[]' ? '' : ', ';
            replacer.insert(pos, `${comma}HttpClientModule`, priority);
          }
          if (!value.elements.find(i => i.getText().startsWith('TranslateModule.forRoot'))) {
            replacer.insert(pos, `, TranslateModule.forRoot({\n      loader: {\n        provide: TranslateLoader,\n        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),\n        deps: [HttpClient]\n      }\n    })`);
          }
        }
      }]
    });

    console.log(project.line);
  }

  constructor(public project: CodeProject) {}

  public async install(project?: CodeProject): Promise<void> {
    this.project = project || this.project;
    return i18n.install(this.project);
  }
}
