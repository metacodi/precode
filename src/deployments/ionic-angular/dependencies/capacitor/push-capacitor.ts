import chalk from 'chalk';
import * as ts from 'typescript';

import { Terminal } from '../../../../utils/terminal';
import { Resource, ResourceType } from '../../../../utils/resource';

import { CodeDeployment } from '../../../abstract/code-deployment';
import { DeploymentOptions } from '../../../../projects/types';
import { TypescriptProject } from '../../../../projects/typescript-project';
import { TypescriptDeployment } from '../../../abstract/typescript-deployment';

import { TypescriptDependency } from '../../../typescript/typescript-dependency';
import { TypescriptCapacitor } from '../../../typescript/typescript-capacitor';
import { FileExists } from '../../../basics/file-exists';


/**
 * Push notifications plugin
 *
 * Instal·la el mòdul de notificacions push del capacitor
 * ```typescript
 * const push = mew PushCapacitor(project);
 * push.deploy();
 * ```
 */
export class PushCapacitor extends TypescriptDeployment {

  title = 'Push Notifications with Capacitor';

  // preRequisites = [ new TypescriptCapacitor() ];

  constructor(data?: { [key: string]: any; }, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      if (data && data.showTitle) { Terminal.title(this.title); }

      const tasks: any[] = [

        new TypescriptCapacitor(),

        new TypescriptDependency({ install: 'capacitor-fcm', type: '--save' }),

        new FileExists({
          fileName: project.rootPath('GoogleService-Info.plist'),
          help: `  → Download from ${chalk.blue('https://firebase.google.com/docs?authuser=0')}`
        }),

      ];

      // TODO: app-core ? check core/plugins/push.ts, contructor, notifications.service

      resolve(await this.run(tasks, project, options));

      if (data && data.showTitle) { Terminal.line(); }

      resolve(true);
    });
  }
}
