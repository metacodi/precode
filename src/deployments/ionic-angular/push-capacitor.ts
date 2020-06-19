import chalk from 'chalk';
import * as ts from 'typescript';

import { TypescriptProject } from '../../typescript-project';
import { Terminal } from '../../utils/terminal';
import { TypescriptDeployment } from '../../typescript-deployment';
import { Resource } from '../../utils/resource';
import { ResourceType } from '../../code-project-types';
import { TestOptions } from '../../typescript-project-types';
import { CodeDeployment } from '../../code-deployment';


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

  constructor(project: TypescriptProject) { super(project); }

  async deploy(project?: TypescriptProject): Promise<boolean> {
    if (!project) { project = this.project; }
    return new Promise<boolean>(async (resolve: any, reject: any) => {

      Terminal.title(this.title);

      this.deployCapacitor();

      await project.install([`npm install --save capacitor-fcm`]);

      // Comprovar si els fitxers de Google-FCM `GoogleService-Info.plist` estan instal·lats.
      if (!this.testGoogleServiceInfoPlist()) {
        // Llançar una alerta amb l'enllaç a la pàgina de Google.
        Terminal.warning(`No s'ha trobat l'arxiu '${chalk.bold('GoogleService-Info.plist')}'`);
      }

      // TODO: app-core ? check core/plugins/push.ts, contructor, notifications.service

      Terminal.line();

      resolve(true);
    });
  }

  async test(project?: TypescriptProject, options?: TestOptions): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      options = CodeDeployment.defaultTestOptions(options);
      const { echo, verbose, resolveOnFail } = options;

      if (!project) { project = this.project; }

      Terminal.title(`Testing ${this.title}`);

      if (!this.testCapacitor(options) && resolveOnFail) { resolve(false); return; }

      if (!project.testDependency('capacitor-fcm', options) && resolveOnFail) { resolve(false); return; }
      if (!this.testGoogleServiceInfoPlist(options) && resolveOnFail) { resolve(false); return; }

      Terminal.line();

      resolve(true);
    });
  }

  testGoogleServiceInfoPlist(options?: TestOptions): boolean {
    options = CodeDeployment.defaultTestOptions(options);
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(this.project.projectPath) as ResourceType[];

    const fileName = 'GoogleService-Info.plist';

    if (!resources.find(r => r.isFile && r.name === fileName)) {
      if (options.echo) { Terminal.fail(`No s'ha trobat l'arxiu ${Terminal.file(fileName)}.`); }
      return false;

    } else {
      if (options.echo && options.verbose) { Terminal.success(`Existeix l'arxiu ${Terminal.file(fileName)}.`); }
      return true;
    }
  }
}
