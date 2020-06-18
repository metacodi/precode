import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import { CodeProject, TextReplacer } from '../..';
import { TypescriptProject } from '../../typescript-project';
import { Terminal } from '../../../utils/terminal';
import { CodeDeployment } from '../../code-deployment';


/**
 * i18n - Translate Module
 *
 * Instal·la el mòdul de traducció al projecte.
 * ```typescript
 * i18n.deploy(project);
 * ```
 */
// tslint:disable-next-line: class-name
export class i18n extends CodeDeployment {

  title = 'i18n - Translate Module';

  constructor(project: TypescriptProject) {
    super(project);
  }

  async deploy(project?: TypescriptProject): Promise<boolean> {
    if (!project) { project = this.project; }
    return new Promise<boolean>(async (resolve: any, reject: any) => {

      Terminal.title(this.title);

      await project.install([
        `npm install @ngx-translate/core --save`,
        `npm install @ngx-translate/http-loader --save`,
      ]);

      // await project.folder('src/assets/i18n');
      // await project.file('src/assets/i18n/es.json', { contentFromFile: 'resources/i18n/es.json' });

      await project.fileImports('src/app/app.module.ts', [
        { specifiers: [ 'TranslateModule', 'TranslateLoader' ], source: '@ngx-translate/core' },
        { specifiers: [ 'TranslateHttpLoader' ], source: '@ngx-translate/http-loader' },
        { specifiers: [ 'HttpClientModule', 'HttpClient' ], source: '@angular/common/http' },
      ]);

      await project.file('src/app/app.module.ts', {
        replaces: [
          {
          description: `Afegint importacions ${chalk.bold('HttpClientModule, TranslateModule')} al decorador '${chalk.bold('@NgModule')}'...`,
          replace: (file: ts.SourceFile, replacer: TextReplacer) => {
            const classe = project.findClassDeclaration('AppModule', file.statements);
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

      Terminal.line();

      resolve(true);
    });
  }

  async test(project?: TypescriptProject, options?: { resolveOnFail?: boolean, verbose?: boolean }): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      if (!options) { options = {}; }
      if (options.resolveOnFail === undefined) { options.resolveOnFail = true; }
      if (options.verbose === undefined) { options.verbose = false; }
      const { verbose, resolveOnFail } = options;

      if (!project) { project = this.project; }

      Terminal.title(`Testing ${this.title}`);

      if (!project.testDependency('@ngx-translate/core', { verbose }) && resolveOnFail) { resolve(false); return; }
      if (!project.testDependency('@ngx-translate/http-loader', { verbose }) && resolveOnFail) { resolve(false); return; }

      const file: ts.SourceFile = project.getSourceFile('src/app/app.module.ts');

      if (!project.testImport(file, 'TranslateModule', '@ngx-translate/core', { verbose }) && resolveOnFail) { resolve(false); return; }
      if (!project.testImport(file, 'TranslateLoader', '@ngx-translate/core', { verbose }) && resolveOnFail) { resolve(false); return; }
      if (!project.testImport(file, 'TranslateHttpLoader', '@ngx-translate/http-loader', { verbose }) && resolveOnFail) { resolve(false); return; }
      if (!project.testImport(file, 'HttpClientModule', '@ngx-translate/http-loader', { verbose }) && resolveOnFail) { resolve(false); return; }
      if (!project.testImport(file, 'HttpClient', '@ngx-translate/http-loader', { verbose }) && resolveOnFail) { resolve(false); return; }

      const classe = project.findClassDeclaration('AppModule', file.statements);
      const prop = project.getNgModuleProperty(classe, 'imports');

      if (!project.testNgNModuleProperty(prop, 'HttpClientModule', i => i.getText() === 'HttpClientModule', options) && resolveOnFail) { resolve(false); return; }
      if (!project.testNgNModuleProperty(prop, 'TranslateModule', i => i.getText().startsWith('TranslateModule'), options) && resolveOnFail) { resolve(false); return; }

      Terminal.line();

      resolve(true);
    });
  }

}
