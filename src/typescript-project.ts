import { CodeProject } from './code-project';
import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from '@ionic/utils-fs/dist/index.js';
import { TextReplacer } from './utils/text-replacer';
import { FileOptions, FolderOptions, CloneOptions, CurlOptions, ResourceType } from './code-project-types';
import { FileImport, TestOptions } from './typescript-project-types';
import { Terminal } from './utils/terminal';
import { Resource } from './utils/resource';
import { CodeDeployment } from './code-deployment';


/**
 * **Usage**
 *
 * ```typescript
 * #!/usr/bin/env node
 * /// <reference types="node" />
 *
 * import { TypescriptProject } from '@metacodi/precode';
 * import Prompt from 'commander';
 *
 * Prompt.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.');
 * Prompt.parse(process.argv);
 *
 * const project: TypescriptProject = new TypescriptProject(Prompt.directory);
 * project.initialize().then(async () => {
 *   // Instal·la una dependència al projecte.
 *   await project.install([`npm i @types/node --save-dev`]);
 * });
 * ```
 */
export class TypescriptProject extends CodeProject {

  /** Referència al contingut de l'arxiu `tsconfig.json`. */
  tsconfig: any;
  /** Referència al contingut de l'arxiu `package.json`. */
  package: any;

  /** Comrpoba si la carpeta indicada és l'arrel d'un projecte de tipus Typescript. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprpovem si existeix l'arxiu de configuració del projecte.
    return !!resources.find(d => d.name === 'tsconfig.json');
  }

  constructor(folder: string) { super(folder, __dirname); }

  /**
   * Inicialitza el projecte:
   * - Comproba que la carpeta indicada és una *carpeta de projecte*.
   * - Carrega els continguts del arxius de configuració `tsconfig.ts` i `package.json`.
   * - Parseja els arxius per extreure info com per exemple el *nom del projecte*, etc.
   */
  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        // Project directory
        if (!fs.existsSync(this.projectPath)) { Terminal.error(`No s'ha trobat la carpeta del projecte ${chalk.bold(this.projectPath)}`); reject(); }
        if (!TypescriptProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte typescript`); }
        Terminal.log(chalk.bold('Directori del projecte: ') + Terminal.file(this.projectPath));

        // Config files.
        Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('tsconfig.json'))} de configuració...`);
        this.tsconfig = Resource.openJson(this.rootPath('tsconfig.json'));
        Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('package.json'))} de configuració...`);
        this.package = Resource.openJson(this.rootPath('package.json'));

        // Nombre del proyecto.
        this.name = this.package && this.package.name ? this.package.name : '';

        resolve(true);

      } catch (error) {
        Terminal.error(error);
        reject();
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  Dependencies
  // --------------------------------------------------------------------------------

  /** Comprova si el `package.json` conté la dependència indicada. */
  hasDependency(name: string): boolean {
    if (this.package && typeof this.package.dependencies === 'object') {
      return Object.keys(this.package.dependencies).includes(name);
    }
  }

  /** Passa el test */
  testDependency(name: string, options?: TestOptions): boolean {
    options = CodeDeployment.defaultTestOptions(options);

    if (!this.hasDependency(name)) {
      if (options.echo) { Terminal.fail(`Falta la dependència ${chalk.bold(name)}.`); }
      return false;

    } else {
      if (options.echo && options.verbose) { Terminal.success(`Dependència instal·lada ${chalk.bold(name)}.`); }
      return true;
    }
  }


  // --------------------------------------------------------------------------------
  //  Imports
  // --------------------------------------------------------------------------------

  /**
   * Afegeix o treu importacions a l'arxiu typescript indicat.
   *
   * ```typescript
   * await project.fileImports('src/app/app.module.ts', [
   *   { action: 'remove', specifiers: [ 'AppRoutingModule' ], source: './app-routing.module' },
   *   { action: 'add', specifiers: [ 'Routes' ], source: '@angular/router' },
   * ]);
   * ```
   * @category Command
   */
  fileImports(fileName: string, imports: FileImport[], fileContent?: string): string {

    const fullName = this.rootPath(fileName);
    if (!fs.existsSync(fullName)) { Terminal.error(`No existeix l'arxiu ${Terminal.file(fileName)}`); return fileContent; }

    if (!fileContent) { Terminal.verbose(`Llegint arxiu ${Terminal.file(fileName)}...`); }
    let content: string = fileContent || fs.readFileSync(fullName, 'utf-8').toString();

    if (imports && imports.length) {
      Terminal.log(`Modificant importacions de l'arxiu ${Terminal.file(fileName)}...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fullName, content);
      const replacer: TextReplacer = new TextReplacer(content);

      // Get declared imports.
      const declared: any[] = this.getImports(sourceFile);
      // Reference last import.
      const lastImport = declared.length ? declared[declared.length - 1] : undefined;

      // Execute import actions.
      for (const i of imports) {
        // Buscamos todas las importaciones declaradas del módulo actual.
        const found = declared.filter((d: any) => d.source === `'${i.source}'`);
        // Default value.
        if (!i.action) { i.action = 'add'; }

        if (i.action === 'add') {
          if (found.length) {
            const add: any[] = [];
            // Filtramos los specifier que no están en ninguna importación.
            i.specifiers.map((s: any) => { if (found.filter(f => f.specifiers.includes(s)).length === 0) { add.push(s); } });
            if (add.length) {
              Terminal.success(`Afegint ${chalk.bold(add.join(', '))} a la fila existent de ${chalk.bold(i.source)}`);
              const newImport = `\nimport \{ ${found[0].specifiers.concat(add).join(', ')} \} from '${i.source}';`;
              replacer.replaceNode(found[0], newImport);

            } else {
              Terminal.verbose(`- Ja existeix la importació de ${chalk.bold(i.source)}`);
            }
          } else {
            Terminal.success(`Afegint fila d'importació per '${chalk.bold(i.source)}'...`);
            const newImport = `\nimport \{ ${i.specifiers.join(', ')} \} from '${i.source}';`;
            replacer.insertAfter(lastImport, newImport);
          }

        } else if (i.action === 'remove') {
          if (found.length) {
            // Repasamos cada import para quitar los specifiers indicados.
            found.map(f => {
              // Quitamos los specifier que hay que eliminar de la importación.
              const rest: any[] = f.specifiers.filter((s: any) => !i.specifiers.includes(s));
              const remove: any[] = f.specifiers.filter((s: any) => i.specifiers.includes(s));
              if (rest.length) {
                Terminal.success(`Eliminant ${chalk.bold(remove.join(', '))} de la fila de ${chalk.bold(i.source)}`);
                const newImport = `\nimport \{ ${rest.join(', ')} \} from '${i.source}';`;
                replacer.replaceNode(f, newImport);
              } else {
                Terminal.success(`Eliminant importació de ${chalk.bold(i.source)}...`);
                replacer.deleteNode(f);
              }
            });
          } else {
            Terminal.verbose(`- Ja no existeix la importació de ${chalk.bold(i.source)}`);
          }
        } else {
          Terminal.warning(`No es reconeix el tipus d'acció '${i.action}' per la importació de ${chalk.bold(i.source)}`);
        }
      }
      content = replacer.apply();

    } else {
      // Terminal.verbose(`No s'ha definit cap importació per a l'arxiu '${Terminal.file(fileName)}'.`);
    }
    return content;
  }

  /** Retorna una llista de les importacions de l'arxiu. */
  getImports(sourceFile: ts.SourceFile) {
    return this.filterNodes(sourceFile.statements, ts.SyntaxKind.ImportDeclaration, { firstOnly: false }).map((node: ts.ImportDeclaration) => ({
      specifiers: node.importClause.getText().replace('{', '').replace('}', '').split(',').map((e: any) => e.trim()),
      source: node.moduleSpecifier.getText(),
      pos: node.pos,
      end: node.end,
    }));
  }

  /** Comprueba si la importación está declarada. */
  testImport(file: ts.SourceFile, specifier: string, source: string, options?: TestOptions): boolean {
    options = CodeDeployment.defaultTestOptions(options);
    const imports: any[] = this.getImports(file);
    const fileName = path.relative(this.projectPath, file.fileName);

    if (!imports.find(i => i.source === `'${source}'` && i.specifiers.includes(specifier))) {
      if (options.echo) { Terminal.fail(`Falta la importació de ${chalk.bold(specifier)} a l'arxiu ${Terminal.file(fileName)}.`); }
      return false;

    } else {
      if (options.echo && options.verbose) { Terminal.success(`Importació correcta de ${chalk.bold(specifier)} a l'arxiu ${Terminal.file(fileName)}.`); }
      return true;
    }
  }


  // --------------------------------------------------------------------------------
  //  replaces
  // --------------------------------------------------------------------------------

  /** @category Command */
  protected replaces(fileName: string, options: FileOptions): string {
    if (options.replaces && options.replaces.length) {
      Terminal.log(`Actualitzant codi de l'arxiu '${Terminal.file(fileName)}'...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fileName, options.content);
      const replacer: TextReplacer = new TextReplacer(options.content);

      // Execute replaces.
      for (const action of options.replaces) {
        let descartado = false;
        if (!!action.skip) {
          if (typeof action.skip === 'string') { action.skip = new RegExp(action.skip); }
          if (action.skip.test(options.content)) {
            descartado = true;
            Terminal.verbose(`- S'ha descartat substituir l'expressió perquè ja existeix.`);
          }
        }
        if (!descartado) {
          if (typeof action.replace === 'function') {
            Terminal.log(action.description ? '- ' + action.description : `- Executant funció de substitució`);
            action.replace(sourceFile, replacer);
            options.content = replacer.apply(options.content);
          } else {
            Terminal.log(action.description ? '- ' + action.description : `- Substituint l'expressió: ` + chalk.grey(action.match.toString()));
            options.content = options.content.replace(action.match || '', action.replace || '');
          }
        }
      }
    } else {
      // Terminal.verbose(`No s'ha definit cap substitució per a l'arxiu '${Terminal.file(fileName)}'.`);
    }
    return options.content;
  }


  // --------------------------------------------------------------------------------
  //  Abstract Syntax Tree
  // --------------------------------------------------------------------------------

  /** Obtiene el contenido del archivo indicado y devuelve una estructura de código fuente `ts.SourceFile`. */
  getSourceFile(fileName: string, content?: string): ts.SourceFile {
    const fullName = this.rootPath(fileName);
    if (!fs.existsSync(fullName)) { Terminal.error(`No existeix l'arxiu ${Terminal.file(fileName)}`); return undefined; }
    return ts.createSourceFile(fullName, content || fs.readFileSync(fullName, 'utf-8'), ts.ScriptTarget.Latest, true);
  }

  /** Atraviesa el AST en busca de un nodo con la declaración de la clase indicada. */
  findClassDeclaration(name: string, source: any, throwError = true): ts.ClassDeclaration {
    const classe: ts.ClassDeclaration = this.findNode(source, (node: ts.Node): boolean =>
      node.kind === ts.SyntaxKind.ClassDeclaration
      && (node as ts.ClassDeclaration).name.text === name
    ) as ts.ClassDeclaration;
    if (!classe && throwError) { Terminal.error(`No s'ha trobat la classe '${chalk.bold('AppModule')}'.`, false); return undefined; }
    return classe;
  }

  /** Devuelve una de las propiedades `imports`, `providers`, `entryComponents` o `declarations` del decorador de clase `@NgModule`. */
  getNgModuleProperty(classe: ts.ClassDeclaration, propName: string, throwError = true): ts.PropertyAssignment {
    const deco = classe.decorators.find(d => ((d.expression  as ts.CallExpression).expression as ts.Identifier).text === 'NgModule');
    if (!deco) {
      if (throwError) { Terminal.error(`No s'ha trobat el decorador de classe '${chalk.bold('@NgModule')}'.`, false); }
      return undefined;
    }
    const obj = (deco.expression  as ts.CallExpression).arguments[0] as ts.ObjectLiteralExpression;
    const prop = obj.properties.find((p: ts.PropertyAssignment) => p.name.getText() === propName) as ts.PropertyAssignment;
    if (!prop) {
      if (throwError) { Terminal.error(`No s'ha trobat la propietat '${chalk.bold(propName)}' al decorador de classe '${chalk.bold('@NgModule')}'.`, false); }
      return undefined;
    }
    return prop;
  }

  /** Comproba una propietat del decorador. */
  testNgNModuleProperty(prop: ts.PropertyAssignment, module: string, test: ((i: ts.Expression) => boolean), options?: TestOptions): boolean {
    options = CodeDeployment.defaultTestOptions(options);

    const value = prop.initializer as ts.ArrayLiteralExpression;

    if (!value.elements.find(i => test(i))) {
      if (options.echo) { Terminal.fail(`Falta la importació ${chalk.bold(module)} al decorador ${chalk.bold('@NgModule')}.`); }
      return false;
    } else {
      if (options.echo && options.verbose) { Terminal.success(`Importació ${chalk.bold(module)} al decorador ${chalk.bold('@NgModule')}.`); }
      return true;
    }

  }

  /** Función que atraviesa el AST en busca de ocurrencias. */
  filterNodes(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): ts.Node[] {
    if (!Array.isArray(nodes)) { nodes = [nodes]; }
    if (typeof filter !== 'function' && !Array.isArray(filter)) { filter = [filter]; }
    if (!options) { options = {}; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (options.firstOnly === undefined) { options.firstOnly = true; }

    const results: (ts.Node | ts.Statement)[] = [];

    for (const node of nodes) {
      if (!results.length || !options.firstOnly) {

        if (typeof filter === 'function') {
          if (filter(node)) { results.push(node); }
        } else if (Array.isArray(filter)) {
          if ((filter as ts.SyntaxKind[]).includes(node.kind)) { results.push(node); }
        }
        if (results.length && options.firstOnly) { return results; }

        if (options.recursive) {
          node.forEachChild((child: ts.Node | ts.Statement) => {
            if (!results.length || !options.firstOnly) {
              results.push(...this.filterNodes(child, filter, options));
            }
          });
        }
      }
    }
    return results;
  }

  /** Función que atraviesa el AST en busca de la primera ocurrencia. */
  findNode(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: { recursive?: boolean, firstOnly?: boolean }): ts.Node {
    const results = this.filterNodes(nodes, filter, { firstOnly: true });
    return results && results.length ? results[0] : undefined;
  }

}
