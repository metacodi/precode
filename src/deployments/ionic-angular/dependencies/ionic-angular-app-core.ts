import ts from 'typescript';

import { Resource } from '../../../utils/resource';
import { Terminal } from '../../../utils/terminal';

import { IonicAngularDeployment } from '../../abstract/ionic-angular-deployment';
import { IonicAngularProject } from '../../../projects/ionic-angular-project';
import { DeploymentOptions } from '../../../projects/types';
import { CodeDeployment } from '../../abstract/code-deployment';

import { TypescriptDependency } from '../../typescript/typescript-dependency';
import { I18n } from '../../angular/i18n';
import { PushCapacitor } from './capacitor/push-capacitor';
import { TypescriptConstructor } from '../../typescript/typescript-constructor';
import { CustomDeployment } from '../../basics/custom-deployment';



export class IonicAngularAppCore extends IonicAngularDeployment {

    title = `Install Ionic Angular App Core`;

    project: IonicAngularProject;

    static async deploy(project: IonicAngularProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
      const instance = new IonicAngularAppCore(data || {}, project, options);
      if (instance.title) { Terminal.title(instance.title); }
      return instance.deploy();
    }

    constructor(data?: { [key: string]: any; }, project?: IonicAngularProject, options?: DeploymentOptions) {
      super(data, project, options);
    }

    async deploy(project?: IonicAngularProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
      return new Promise<boolean>(async (resolve: any, reject: any) => {
        options = CodeDeployment.extendOptions(options || this.options);
        if (!project) { project = this.project; }
        if (!data) { data = this.data; }

        const appModule: ts.SourceFile = project.getSourceFile('src/app/app.module.ts');

        const appComponent: ts.SourceFile = project.getSourceFile('src/app/app.component.ts');
        const classe = project.findClassDeclaration('AppComponent', appComponent.statements);

        const tasks: any[] = [

          new I18n(),

          new PushCapacitor(),

          new TypescriptDependency({ install: 'moment' }),

          new TypescriptDependency({ install: 'file-saver' }),
          new TypescriptDependency({ install: '@types/file-saver', type: '--save-dev' }),

          new TypescriptDependency({ install: '@ionic-native/core' }),

          new TypescriptDependency({ install: '@ionic-native/status-bar' }),

          new TypescriptDependency({ install: 'cordova-plugin-brightness' }),
          new TypescriptDependency({ install: '@ionic-native/brightness' }),

          new TypescriptDependency({ install: '@ionic-native/android-fingerprint-auth' }),
          new TypescriptDependency({ install: 'cordova-plugin-android-fingerprint-auth' }),

          new TypescriptDependency({ install: 'https://github.com/fabiorogeriosj/cordova-plugin-sensors.git', dependency: 'cordova-plugin-sensors' }),
          new TypescriptDependency({ install: '@ionic-native/sensors' }),

          new TypescriptConstructor({ file: appComponent, identifier: 'lang', type: 'AppLanguageService' }),

        ];

        resolve(await this.run(tasks, project, options));
      });
    }

}

/*
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
  }
*/
