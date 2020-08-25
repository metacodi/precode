import ts from 'typescript';

import { IonicAngularDeployment } from '../deployments/abstract/ionic-angular-deployment';
import { IonicAngularProject } from '../projects/ionic-angular-project';
import { DeploymentOptions } from '../projects/types';
import { CodeDeployment } from '../deployments/abstract/code-deployment';

import { TypescriptDependency } from '../deployments/typescript/typescript-dependency';
import { TypescriptImport } from '../deployments/typescript/typescript-import';
import { AngularNgModule } from '../deployments/angular/ngModule';



export class AppBase extends IonicAngularDeployment {

    title = `Mòdul base de l'aplicació`;

    project: IonicAngularProject;

    constructor(data?: { [key: string]: any; }, project?: IonicAngularProject, options?: DeploymentOptions) {
      super(data, project, options);
    }

    async deploy(project?: IonicAngularProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
      return new Promise<boolean>(async (resolve: any, reject: any) => {
        options = CodeDeployment.extendOptions(options || this.options);
        if (!project) { project = this.project; }
        if (!data) { data = this.data; }

        const appModule: ts.SourceFile = project.getSourceFile('src/app/app.module.ts');

        const tasks: any[] = [
          // new TypescriptDependency({ install: '@capacitor/core' }),
          // new TypescriptImport({ file: appModule, import: 'HttpClient', module: '@angular/common/http' }),
          // new AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'imports', module: 'HttpClientModule', test: (value: any) => value.getText() === 'HttpClientModule' }),
        ];

        resolve(await this.run(tasks, project, options));
      });
    }

}
