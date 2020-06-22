import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import * as fs from 'fs';

import { TextReplacer } from '../../utils/text-replacer';
import { CodeDeployment } from '../abstract/code-deployment';
import { DeploymentOptions } from '../../projects/types';
import { AngularProject } from '../../projects/angular-project';
import { AngularDeployment } from '../abstract/angular-deployment';
import { TypescriptDependency } from '../typescript/typescript-dependency';
import { TypescriptImport } from '../typescript/typescript-import';
import { AngularNgModule } from './angular-ngModule';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { TypescriptCapacitor } from '../typescript/typescript-capacitor';
import { PushCapacitor } from '../ionic-angular/dependencies/capacitor/push-capacitor';


/**
 * i18n - Translate Module
 *
 * Compatibile amb projectes:
 * - Angular Typescript
 *
 * Instal·la el mòdul de traducció al projecte.
 * ```typescript
 * const Di18n = new i18n();
 * await Di18n.deploy(project);
 * ```
 */
// tslint:disable-next-line: class-name
export class i18n extends AngularDeployment {

  title = 'i18n - Translate Module';

  project: AngularProject;

  constructor(data?: { [key: string]: any; }, project?: AngularProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: AngularProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const appModule: ts.SourceFile = project.getSourceFile('src/app/app.module.ts');

      const tasks: any[] = [

        new PushCapacitor(),

        new TypescriptDependency({ install: '@ngx-translate/core' }),
        new TypescriptDependency({ install: '@ngx-translate/http-loader' }),

        new TypescriptImport({ file: appModule, import: 'TranslateModule', from: '@ngx-translate/core' }),
        new TypescriptImport({ file: appModule, import: 'TranslateLoader', from: '@ngx-translate/core' }),
        new TypescriptImport({ file: appModule, import: 'TranslateHttpLoader', from: '@ngx-translate/http-loader' }),
        new TypescriptImport({ file: appModule, import: 'HttpClientModule', from: '@angular/common/http' }),
        new TypescriptImport({ file: appModule, import: 'HttpClient', from: '@angular/common/http' }),

        new AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'imports', element: 'HttpClientModule', test: (e: any) => e.getText() === 'HttpClientModule' }),
        new AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'imports', element: 'TranslateModule', test: (e: any) => e.getText().startsWith('TranslateModule'),
          text: `TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),
        deps: [HttpClient]
      }
    })`,
        }),

      ];

      // TODO: Comprovar si està instal·lada la lliberia app-core i extendre el deploy per
      // comprovar AppLanguageService, arxius de recursos, etc.

      resolve(await this.run(tasks, project, options));
    });
  }

  // async deploy_OLD(project?: AngularProject, options?: DeploymentOptions): Promise<boolean> {
  //   return new Promise<boolean>(async (resolve: any, reject: any) => {
  //     options = CodeDeployment.extendOptions(options);
  //     const { echo, verbose, resolveOnFail } = options;

  //     if (!project) { project = this.project; }

  //     await project.install([
  //       `npm install @ngx-translate/core --save`,
  //       `npm install @ngx-translate/http-loader --save`,
  //     ]);

  //     // await project.folder('src/assets/i18n');
  //     // await project.file('src/assets/i18n/es.json', { contentFromFile: 'resources/i18n/es.json' });

  //     await project.fileImports('src/app/app.module.ts', [
  //       { import: 'TranslateModule', module: '@ngx-translate/core' },
  //       { import: 'TranslateLoader', module: '@ngx-translate/core' },
  //       { import: 'TranslateHttpLoader', module: '@ngx-translate/http-loader' },
  //       { import: 'HttpClientModule', module: '@angular/common/http' },
  //       { import: 'HttpClient', module: '@angular/common/http' },
  //     ]);

  //     await project.file('src/app/app.module.ts', {
  //       replaces: [
  //         {
  //         description: `Afegint importacions ${chalk.bold('HttpClientModule, TranslateModule')} al decorador '${chalk.bold('@NgModule')}'...`,
  //         replace: (file: ts.SourceFile, replacer: TextReplacer) => {
  //           const classe = project.findClassDeclaration('AppModule', file.statements);
  //           const prop = project.getNgModuleProperty(classe, 'imports');
  //           const value = prop.initializer as ts.ArrayLiteralExpression;
  //           // Insertem al final (end) retrocedint un caràcter per estar dins dels paréntesis (ej: '[]')
  //           const pos = value.end - 1;

  //           if (!value.elements.find(i => i.getText() === 'HttpClientModule')) {
  //             const priority = 1;
  //             const comma = value.getText() === '[]' ? '' : ', ';
  //             replacer.insert(pos, `${comma}HttpClientModule`, priority);
  //           }
  //           if (!value.elements.find(i => i.getText().startsWith('TranslateModule.forRoot'))) {
  //             replacer.insert(pos, `, TranslateModule.forRoot({\n      loader: {\n        provide: TranslateLoader,\n        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),\n        deps: [HttpClient]\n      }\n    })`);
  //           }
  //         }
  //       }]
  //     });

  //     // TODO: app-core ? check app-language.service
  //     resolve(true);
  //   });
  // }

  // async test_OLD(project?: AngularProject, options?: DeploymentOptions): Promise<boolean> {
  //   return new Promise<boolean>((resolve: any, reject: any) => {
  //     if (!options) { options = this.options; }
  //     this.options = options = CodeDeployment.extendOptions(options);
  //     const { echo, verbose, resolveOnFail } = options;

  //     if (!project) { project = this.project; }

  //     if (!project.testDependency('@angular/core', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testDependency('@ngx-translate/core', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testDependency('@ngx-translate/http-loader', options) && resolveOnFail) { resolve(false); return; }

  //     const file: ts.SourceFile = project.getSourceFile('src/app/app.module.ts');

  //     if (!project.testImport(file, 'TranslateModule', '@ngx-translate/core', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testImport(file, 'TranslateLoader', '@ngx-translate/core', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testImport(file, 'TranslateHttpLoader', '@ngx-translate/http-loader', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testImport(file, 'HttpClientModule', '@angular/common/http', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testImport(file, 'HttpClient', '@angular/common/http', options) && resolveOnFail) { resolve(false); return; }

  //     const classe = project.findClassDeclaration('AppModule', file.statements);
  //     const prop = project.getNgModuleProperty(classe, 'imports');

  //     if (!project.testNgModuleProperty(prop, 'HttpClientModule', i => i.getText() === 'HttpClientModule', options) && resolveOnFail) { resolve(false); return; }
  //     if (!project.testNgModuleProperty(prop, 'TranslateModule', i => i.getText().startsWith('TranslateModule'), options) && resolveOnFail) { resolve(false); return; }

  //     resolve(true);
  //   });
  // }

}
