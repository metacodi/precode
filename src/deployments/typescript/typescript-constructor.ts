import chalk from 'chalk';
import path from 'path';
import ts from 'typescript';

import { Terminal } from '../../utils/terminal';
import { Resource } from '../../utils/resource';

import { CodeDeployment } from '../abstract/code-deployment';
import { TypescriptProject } from '../../projects/typescript-project';
import { TypescriptDeployment } from '../abstract/typescript-deployment';
import { DeploymentOptions, TypescriptConstructorType } from '../../projects/types';
import { TypescriptParser } from '../../parsers/typescript-parser';
import { TextReplacer } from '../../utils/text-replacer';

/** Afegeix o treu una declaració del constructor de la classe. */
export class TypescriptConstructor extends TypescriptDeployment {

  constructor(data?: TypescriptConstructorType, project?: TypescriptProject, options?: DeploymentOptions) {
    super(data, project, options);
  }

  async deploy(project?: TypescriptProject, options?: DeploymentOptions, data?: { [key: string]: any; }): Promise<boolean> {
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      options = CodeDeployment.extendOptions(options || this.options);
      if (!project) { project = this.project; }
      if (!data) { data = this.data; }

      const file: ts.SourceFile = project.getSourceFile(data.file.fileName);
      const classe = data.class
        // Busquem la classe a partir del nom suministrat.
        ? project.findClassDeclaration(data.class, file.statements)
        // Si no s'ha indicat cap nomm de classe, ens quedem amb la primera aparició.
        : TypescriptParser.find(file.statements, ts.SyntaxKind.ClassDeclaration, { recursive: true }) as ts.ClassDeclaration;

      // Cerquem el constructor de la classe trobada.
      const method = TypescriptParser.find(classe, ts.SyntaxKind.Constructor, { recursive: true }) as ts.ConstructorDeclaration;
      if (!method) { Terminal.error(`No s'ha trobat el constructor de la classe '${chalk.bold(classe?.name?.text)}'.`, false); return undefined; }

      const identifier = data.identifier;
      const modifier = data.modifier || 'public';
      const type = data.type;

      if (!method.parameters.find(p => (p.type as any)?.typeName?.escapedText === type)) {
        if (options.onlyTest) {
          if (options.echo) { Terminal.fail(`Falta ${chalk.bold(type)} al constructor de la classe ${chalk.bold(classe.name.text)}.`); }
          resolve(false);

        } else {
          if (options.echo) { Terminal.success(`Afegint ${chalk.bold(type)} al constructor de la classe ${chalk.bold(classe.name.text)}.`); }
          const pos = method.parameters.pos; // - (method.parameters.length ? 1 : 0);
          const content: string = Resource.open(file.fileName);
          const replacer: TextReplacer = new TextReplacer(content);

          if (method.parameters.length) {
            const params = method.parameters.map(p => '\n    ' + p.getText());
            params.push(`\n    ${modifier} ${identifier}: ${type},`);
            replacer.replaceNode(method.parameters, params.join());

          } else {
            replacer.insert(pos, `\n    ${modifier} ${identifier}: ${type},\n  `);
          }

          resolve(Resource.save(file.fileName, replacer.apply()));
        }

      } else {
        if (options.echo) { Terminal.success(`Paràmetre ${chalk.bold(type)} al constructor de la classe ${chalk.bold(classe.name.text)}.`); }
        resolve(true);
      }

    });
  }

}

