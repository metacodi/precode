import { CodeProject } from './code-project';
import chalk from 'chalk'; // const chalk = require('chalk');
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from '@ionic/utils-fs/dist/index.js';
import { TextReplacer } from './text-replacer';
import { FileOptions, FolderOptions, CloneOptions, CurlOptions, DirentType } from './code-project-types';
import { FileImport } from './typescript-project-types';



export class TypescriptProject extends CodeProject {

  config: any;
  package: any;

  static discoverProjects(folder: string): any[] {
    const projects: any[] = [];

    if (!fs.existsSync(folder)) { return projects; }

    // Examinamos los recursos de la carpeta actual para identificar posibles proyectos.
    const files = fs.readdirSync(folder);
    for (const resource of Object.values(files)) {
      const info = fs.lstatSync(resource);
      if (info.isDirectory()) {
        if (resource === 'node_modules') {
          // console.log(chalk.bold('Projecte de tipus typescript !!!'));
          projects.push('typescript');
          break;
        }
      } else {
        if (resource === 'tsconfig.json') {
          // console.log(chalk.bold('Projecte de tipus typescript !!!'));
          projects.push('typescript');
          break;
        }
      }
    }

    // Si no hemos encontrado nada, miramos en las sub carpetas.
    if (!projects.length) {
      for (const resource of Object.values(files)) {
        const info = fs.lstatSync(resource);
        if (info.isDirectory()) {
          projects.push(...this.discoverProjects(resource));
        }
      }
    }

    return projects;
  }

  constructor(folder: string) {
    super(folder, __dirname);
  }

  async initialize(): Promise<boolean> {
    return new Promise<any>((resolve: any, reject: any) => {
      // const fileName = 'precode.json';
      try {
        // Project directory
        if (!fs.existsSync(this.projectPath)) { this.error(`No s'ha trobat la carpeta del projecte '${this.projectPath}'.`); reject(); }
        if (!this.assertIsTypescriptProject(this.projectPath)) { this.error(`La carpeta '${this.chalkFile(this.projectPath)}' no es d'un projecte typescript`); }
        this.log(chalk.bold('Directori del projecte: ') + this.chalkFile(this.projectPath));

        // Config files.
        this.log(`Carregant arxiu de configuració '${this.chalkFile(chalk.bold('tsconfig.json'))}'...`);
        this.config = this.openJsonFile(this.rootPath('tsconfig.json'));
        this.log(`Carregant arxiu de configuració '${this.chalkFile(chalk.bold('package.json'))}'...`);
        this.package = this.openJsonFile(this.rootPath('package.json'));

        // Nombre del proyecto.
        this.name = this.package && this.package.name ? this.package.name : '';

        // // 'precode.json'
        // if (await utils.pathExists(this.projectPath + '/' + fileName)) {
        //   this.log(`Carregant arxiu de configuració '${this.chalkFile(fileName)}'...`);
        //   const content: string = await utils.fileToString(this.projectPath + '/' + fileName);
        //   if (content) {
        //     try {
        //       this.config = JSON.parse(content);
        //     } catch (error) {
        //       this.error(`Error parsejant l'arxiu de configuració del projecte '${this.chalkFile(fileName)}'.`, false);
        //       this.error(error);
        //     }
        //   } else {
        //     // this.error(`L'arxiu de configuració '${this.chalkFile(fileName)}' està buit!?!`);
        //   }
        //   if (this.config && this.config.git && this.config.git.token && !this.config.git.url.includes(`gitlab-ci-token:`)) {
        //     const git = this.config.git;
        //     git.url = git.url.replace(/(http[s]?:\/\/)(.*)/, `\$1gitlab-ci-token:${git.token}\@\$2`);
        //     this.log(`Tokenitzant la url del git '${chalk.magenta(git.url)}'`);
        //   }
        //   if (content) { this.blob(chalk.grey(content)); }
        // } else {
        //   // this.error(`No s'ha trobat l'arxiu de configuració del projecte '${this.chalkFile(fileName)}'.`);
        // }
        resolve(true);

      } catch (error) {
        this.error(error);
        reject();
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  Project
  // --------------------------------------------------------------------------------

  /** Comprueba si la carpeta indicada es la raíz de un proyecto Typescript. */
  assertIsTypescriptProject(folder: string): boolean {
    // Obtenemos el contenido de la carpeta.
    const dirents = this.discover(folder) as DirentType[];
    // Comprobamos si existe el archivo de configuración del proyecto.
    return !!dirents.find(d => d.name === 'tsconfig.json');
  }


  // --------------------------------------------------------------------------------
  //  Source file
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
    if (!fs.existsSync(fullName)) { this.error(`No existeix l'arxiu '${this.chalkFile(fileName)}'`); return fileContent; }

    if (!fileContent) { this.verbose(`Llegint arxiu '${this.chalkFile(fileName)}'...`); }
    let content: string = fileContent || fs.readFileSync(fullName, 'utf-8').toString();

    if (imports && imports.length) {
      this.log(`Modificant importacions de l'arxiu '${this.chalkFile(fileName)}'...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fullName, content);
      const replacer: TextReplacer = new TextReplacer(content);

      // Get declared imports.
      const declared: any[] = this.filterNodes(sourceFile.statements, ts.SyntaxKind.ImportDeclaration, { firstOnly: false }).map((node: ts.ImportDeclaration) => ({
        specifiers: node.importClause.getText().replace('{', '').replace('}', '').split(',').map((e: any) => e.trim()),
        source: node.moduleSpecifier.getText(),
        pos: node.pos,
        end: node.end,
      }));
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
              this.log(`- Afegint ${chalk.bold(add.join(', '))} a la fila existent de '${chalk.bold(i.source)}'`);
              const newImport = `\nimport \{ ${found[0].specifiers.concat(add).join(', ')} \} from '${i.source}';`;
              replacer.replaceNode(found[0], newImport);

            } else {
              this.verbose(`- Ja existeix la importació de '${chalk.bold(i.source)}'`);
            }
          } else {
            this.log(`- Afegint fila d'importació per '${chalk.bold(i.source)}'...`);
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
                this.log(`- Eliminant ${chalk.bold(remove.join(', '))} de la fila de '${chalk.bold(i.source)}'`);
                const newImport = `\nimport \{ ${rest.join(', ')} \} from '${i.source}';`;
                replacer.replaceNode(f, newImport);
              } else {
                this.log(`- Eliminant importació de '${chalk.bold(i.source)}'...`);
                replacer.deleteNode(f);
              }
            });
          } else {
            this.verbose(`- Ja no existeix la importació de '${chalk.bold(i.source)}'`);
          }
        } else {
          this.warning(`No es reconeix el tipus d'acció '${i.action}' per la importació de '${chalk.bold(i.source)}'`);
        }
      }
      content = replacer.apply();

    } else {
      // this.verbose(`No s'ha definit cap importació per a l'arxiu '${this.chalkFile(fileName)}'.`);
    }
    return content;
  }

  /** @category Command */
  protected replaces(fileName: string, options: FileOptions): string {
    if (options.replaces && options.replaces.length) {
      this.log(`Actualitzant codi de l'arxiu '${this.chalkFile(fileName)}'...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fileName, options.content);
      const replacer: TextReplacer = new TextReplacer(options.content);

      // Execute replaces.
      for (const action of options.replaces) {
        let descartado = false;
        if (!!action.skip) {
          if (typeof action.skip === 'string') { action.skip = new RegExp(action.skip); }
          if (action.skip.test(options.content)) {
            descartado = true;
            this.verbose(`- S'ha descartat substituir l'expressió perquè ja existeix.`);
          }
        }
        if (!descartado) {
          if (typeof action.replace === 'function') {
            this.log(action.description ? '- ' + action.description : `- Executant funció de substitució`);
            action.replace(sourceFile, replacer);
            options.content = replacer.apply(options.content);
          } else {
            this.log(action.description ? '- ' + action.description : `- Substituint l'expressió: ` + chalk.grey(action.match.toString()));
            options.content = options.content.replace(action.match || '', action.replace || '');
          }
        }
      }
    } else {
      // this.verbose(`No s'ha definit cap substitució per a l'arxiu '${this.chalkFile(fileName)}'.`);
    }
    return options.content;
  }


  // --------------------------------------------------------------------------------
  //  Abstract Syntax Tree
  // --------------------------------------------------------------------------------

  /** Obtiene el contenido del archivo indicado y devuelve una estructura de código fuente `ts.SourceFile`. */
  getSourceFile(fileName: string, content?: string): ts.SourceFile {
    return ts.createSourceFile(fileName, content || fs.readFileSync(fileName, 'utf-8'), ts.ScriptTarget.Latest, true);
  }

  /** Atraviesa el AST en busca de un nodo con la declaración de la clase indicada. */
  findClassDeclaration(name: string, source: any, throwError = true): ts.ClassDeclaration {
    const classe: ts.ClassDeclaration = this.findNode(source, (node: ts.Node): boolean =>
      node.kind === ts.SyntaxKind.ClassDeclaration
      && (node as ts.ClassDeclaration).name.text === name
    ) as ts.ClassDeclaration;
    if (!classe && throwError) { this.error(`No s'ha trobat la classe '${chalk.bold('AppModule')}'.`, false); return undefined; }
    return classe;
  }

  /** Devuelve una de las propiedades `imports`, `providers`, `entryComponents` o `declarations` del decorador de clase `@NgModule`. */
  getNgModuleProperty(classe: ts.ClassDeclaration, propName: string, throwError = true): ts.PropertyAssignment {
    const deco = classe.decorators.find(d => ((d.expression  as ts.CallExpression).expression as ts.Identifier).text === 'NgModule');
    if (!deco) {
      if (throwError) { this.error(`No s'ha trobat el decorador de classe '${chalk.bold('@NgModule')}'.`, false); }
      return undefined;
    }
    const obj = (deco.expression  as ts.CallExpression).arguments[0] as ts.ObjectLiteralExpression;
    const prop = obj.properties.find((p: ts.PropertyAssignment) => p.name.getText() === propName) as ts.PropertyAssignment;
    if (!prop) {
      if (throwError) { this.error(`No s'ha trobat la propietat '${chalk.bold(propName)}' al decorador de classe '${chalk.bold('@NgModule')}'.`, false); }
      return undefined;
    }
    return prop;
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
