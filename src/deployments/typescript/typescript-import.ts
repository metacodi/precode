import chalk from 'chalk';
import path from 'path';
import ts from 'typescript';

import { Terminal } from '../../utils/terminal';
import { Resource } from '../../utils/resource';

import { CodeDeployment } from '../abstract/code-deployment';
import { TypescriptProject } from '../../projects/typescript-project';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { DeploymentOptions, TypescriptImportType } from '../../projects/types';

/** Afegeix o treu una importació de l'arxiu indicat. */
export class TypescriptImport extends TypescriptDeployment {

  constructor(data?: TypescriptImportType, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const file: ts.SourceFile = project.getSourceFile(data.file.fileName);
      const specifier: string = data.specifier || data.import;
      const from: string = data.from;

      const imports: any[] = project.getImports(file);
      const fileName = path.relative(project.projectPath, file.fileName);

      if (!imports.find(i => i.from === `'${from}'` && i.imports.includes(specifier))) {
        if (options.onlyTest) {
          if (options.echo) { Terminal.fail(`Falta importació ${chalk.bold(specifier)} a l'arxiu ${Terminal.file(fileName)}.`); }
          resolve(false);

        } else {
          if (options.echo) { Terminal.success(`Instal·lant importació ${chalk.bold(specifier)} a l'arxiu ${Terminal.file(fileName)}.`); }
          const content = project.fileImports(file.fileName, [{ import: specifier, from }]);
          resolve(Resource.save(file.fileName, content));
        }

      } else {
        if (options.verbose) { Terminal.success(`Importació correcta de ${chalk.bold(specifier)} a l'arxiu ${Terminal.file(fileName)}.`); }
        resolve(true);
      }
    });
  }

}
