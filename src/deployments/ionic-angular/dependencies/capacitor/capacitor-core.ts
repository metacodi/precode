import { CodeDeployment } from '../../../abstract/code-deployment';
import { TypescriptProject } from '../../../../projects/typescript-project';
import { TypescriptDeployment } from '../../../abstract/typescript-deployment';
import { DeploymentOptions } from '../../../../projects/types';
import { TypescriptDependency } from '../../../typescript/typescript-dependency';

/** Instal.la les dependències de `@capacitor/core` i `@capacitor/cli` al projecte. */
export class CapacitorCore extends TypescriptDeployment {

  /** Instal.la les dependències de `@capacitor/core` i `@capacitor/cli` al projecte. */
  constructor(data?: { [key: string]: any; }, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const tasks: any[] = [

        new TypescriptDependency({ install: '@capacitor/core', type: '--save' }),
        new TypescriptDependency({ install: '@capacitor/cli', type: '--save-dev' }),

      ];

      resolve(await this.run(tasks, project, options));
    });
  }
}
