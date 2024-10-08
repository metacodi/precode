import chalk from 'chalk';

import { Terminal } from '@metacodi/node-utils';

import { CodeDeployment } from '../../../abstract/code-deployment';
import { DeploymentOptions } from '../../../../projects/types';
import { TypescriptProject } from '../../../../projects/typescript-project';
import { TypescriptDeployment } from '../../../abstract/typescript-deployment';

import { TypescriptDependency } from '../../../typescript/typescript-dependency';
import { CapacitorCore } from './capacitor-core';
import { FileExists } from '../../../utils/file-exists';


/** Instal·la el mòdul de notificacions push del capacitor. */
export class PushCapacitor extends TypescriptDeployment {

  title = 'Push Notifications with Capacitor';

  readme = 'https://github.com/metacodi/test/blob/master/capacitor/pushnotifi/README.md';

  constructor(data?: { [key: string]: any; }, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      if (data?.showTitle) { Terminal.title(this.title); }

      const tasks: any[] = [

        new CapacitorCore(),

        new TypescriptDependency({ install: '@capacitor-community/fcm', type: '--save' }),

        new FileExists({
          fileName: project.rootPath('GoogleService-Info.plist'),
          help: `  → Download from ${chalk.blue('https://firebase.google.com/docs?authuser=0')}`
        }),

      ];

      // TODO: app-core ? check core/plugins/push.ts, constructor, notifications.service

      if (data?.showTitle) { Terminal.line(); }

      resolve(await this.run(tasks, project, options));
    });
  }
}
