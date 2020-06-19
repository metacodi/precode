import { CodeDeployment } from './code-deployment';
import { TypescriptProject } from './typescript-project';
import { Resource } from './utils/resource';
import { ResourceType } from './code-project-types';

export abstract class TypescriptDeployment extends CodeDeployment {

  constructor(project: TypescriptProject) {
    super(project);
  }

  async deployCapacitor() {
    if (!this.project.hasDependency('@capacitor/cli')) {
      await this.project.install(['npm i -D @capacitor/cli']);
    }

    if (!this.project.hasDependency('@capacitor/core')) {
      await this.project.install(['npm i --save @capacitor/core']);
    }
  }

  async testCapacitor(options?: { resolveOnFail?: boolean, verbose?: boolean }): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      if (!options) { options = {}; }
      if (options.resolveOnFail === undefined) { options.resolveOnFail = true; }
      if (options.verbose === undefined) { options.verbose = false; }
      const { verbose, resolveOnFail } = options;
      const project = this.project;

      if (!project.testDependency('@capacitor/cli', { verbose }) && resolveOnFail) { resolve(false); return; }
      if (!project.testDependency('@capacitor/core', { verbose }) && resolveOnFail) { resolve(false); return; }

      resolve(true);
    });
  }

  /** Comprovem si el project té instal·lada la plataforma electron. */
  isCapacitorElectron(): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(this.project.projectPath) as ResourceType[];
    // Comprpovem si existeix una carpeta electron.
    return !!resources.find(r => r.isDirectory && r.name === 'electron');
  }

  /** Comprovem si el project té instal·lada la plataforma ios. */
  isCapacitoriOS(): boolean {
    // Comprovem si té la dependència instal·lada.
    return this.project.hasDependency('@capacitor/ios');
  }

  /** Comprovem si el project té instal·lada la plataforma android. */
  isCapacitorAndroid(): boolean {
    // Comprovem si té la dependència instal·lada.
    return this.project.hasDependency('@capacitor/android');
  }


}
