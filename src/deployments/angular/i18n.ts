import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import * as fs from 'fs';

import { CodeDeployment } from '../abstract/code-deployment';
import { DeploymentOptions } from '../../projects/types';
import { AngularProject } from '../../projects/angular-project';
import { AngularDeployment } from '../abstract/angular-deployment';
import { TypescriptDependency } from '../typescript/typescript-dependency';
import { TypescriptImport } from '../typescript/typescript-import';
import { AngularNgModule } from './ngModule';
import { CustomDeployment } from '../utils/custom-deployment';


/** i18n - Translate Module. */
export class I18n extends AngularDeployment {

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

        new CustomDeployment({
          description: `Comprovant els arxius JSON de traducció.`,
          fn: async () => {
            await project.folder('src/assets/i18n');
            if (!project.exists('src/assets/i18n/es.json')) {
              await project.file('src/assets/i18n/es.json', { content: `{}` });
            }
            return true;
          }
        }),

      ];

      // TODO: app-core ? comprovar AppLanguageService, arxius de recursos 'es.json', ...

      resolve(await this.run(tasks, project, options));
    });
  }

}
