import chalk from 'chalk'; // const chalk = require('chalk');
import php, { Program, Node } from 'php-parser';

import { Terminal, Resource, ResourceType } from '@metacodi/node-utils';

import { CodeProject } from '../projects/code-project';
import { PhpParser } from '../parsers/php-parser';


/** Projecte de codi PHP. */
export class PhpProject extends CodeProject {

  /** Comprova si la carpeta indicada és l'arrel d'un projecte de tipus Typescript. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprova si existeix l'arxiu de configuració del projecte.
    return !!resources.filter(d => d.extension === '.php').length;
  }

  /** Instal·la tot el necessari per crear un projecte d'aquest tipus a la carpeta indicada. */
  static createProject(folder: string) {
    // TODO: Create index.php file.
  }


  // --------------------------------------------------------------------------------
  //  constructor . initialize
  // --------------------------------------------------------------------------------

  constructor(folder?: string) { super(folder); }

  /**
   * Inicialitza el projecte:
   * - Comprova que la carpeta indicada és una *carpeta de projecte*.
   * - Carrega els arxius de configuració `tsconfig.ts` i `package.json`.
   * - Parseja els arxius per extreure info com per exemple el *nom del projecte*, etc.
   */
  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        super.initialize().then(value => {
          // Is Project directory
          if (!PhpProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte ${chalk.bold('php')}`); }

          resolve(true);

        }).catch(error => reject(error));
      } catch (error) {
        Terminal.error(error);
        reject(error);
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  Abstract Syntax Tree
  // --------------------------------------------------------------------------------

  /** Obtiene el contenido del archivo indicado y devuelve una estructura de código fuente (AST). */
  getSourceFile(fileName: string, content?: string): Program {
    const fullName = this.rootPath(fileName);
    const result = PhpParser.parse(fullName, content);
    if (!result) { Terminal.error(`No existeix l'arxiu ${Terminal.file(fileName)}`); return undefined; }
    return result;
  }

  /** Atraviesa el AST en busca de un nodo con la declaración de la clase indicada. */
  findClassDeclaration(name: string, source: any, throwError = true): Node {
    const classe = PhpParser.find(source, (node: Node): boolean => node.kind === 'class' && (node as any).name && (node as any).name.name === name);
    if (!classe && throwError) { Terminal.error(`No s'ha trobat la classe '${chalk.bold(name)}'.`, false); return undefined; }
    return classe;
  }

}
