import chalk from 'chalk';
import * as ts from 'typescript';

import { Terminal } from '../../../../utils/terminal';
import { Resource, ResourceType } from '../../../../utils/resource';

import { CodeDeployment } from '../../../abstract/code-deployment';
import { DeploymentOptions } from '../../../../projects/types';
import { TypescriptProject } from '../../../../projects/typescript-project';
import { TypescriptDeployment } from '../../../abstract/typescript-deployment';

import { TypescriptDependency } from '../../../typescript/typescript-dependency';
import { FileExists } from '../../../basics/file-exists';
import { TypescriptImport } from '../../../typescript/typescript-import';
import { AngularNgModule } from '../../../angular/ngModule';


/** Instal·la el mòdul de notificacions push del capacitor. */
export class CalendarCordova extends TypescriptDeployment {

  title = 'Calendar Cordova Plugin with Capacitor';

  readme = 'https://github.com/metacodi/test/blob/master/capacitor/calendar/README.md';


  constructor(data?: { [key: string]: any; }, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      if (data && data.showTitle) { Terminal.title(this.title); }

      const appModule: ts.SourceFile = project.getSourceFile('src/app/app.module.ts');

      const tasks: any[] = [

        new TypescriptDependency({ install: '@ionic-native/calendar', type: '--save' }),
        new TypescriptDependency({ install: 'npm install cordova-plugin-calendar', type: '--save' }),

        new TypescriptImport({ file: appModule, import: 'Calendar', from: '@ionic-native/calendar/ngx' }),

        new AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'providers', element: 'Calendar', test: (e: any) => e.getText() === 'Calendar' }),

        new FileExists({
          fileName: project.rootPath('platforms/ios/build/emulator/MyApp.app/Info.plist'),
          help: `  → More info ${chalk.blue('https://capacitor.ionicframework.com/docs/ios/configuration/')}`
        }),

        // TODO: add to `Info.plist` file:
        /*
          <key>CFBundleLocalizations</key>
          <array>
            <string>en</string>
            <string>de</string>
            <string>nl</string>
            <string>fr</string>
            <string>it</string>
            <string>pt-BR</string>
          </array>
          <key>NSContactsUsageDescription</key>
          <string>$CONTACTS_USAGE_DESCRIPTION</string>
          <key>NSCalendarsUsageDescription</key>
          <string>$CALENDAR_USAGE_DESCRIPTION</string>
        */
      ];

      // TODO: app-core ? check core/plugins/push.ts, contructor, notifications.service

      resolve(await this.run(tasks, project, options));

      if (data && data.showTitle) { Terminal.line(); }

      resolve(true);
    });
  }
}
