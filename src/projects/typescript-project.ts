import { CodeProject } from './code-project';
import chalk from 'chalk'; // const chalk = require('chalk');
import ts from 'typescript';
import * as fs from 'fs';

import { Terminal, Resource, ResourceType } from '@metacodi/node-utils';

import { FileOptions, TypescriptImportType } from './types';
import { TextReplacer } from '../utils/text-replacer';
import { TypescriptParser } from '../parsers/typescript-parser';


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

  /** Comprova si la carpeta indicada és l'arrel d'un projecte de tipus Typescript. */
  static isProjectFolder(folder: string): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(folder) as ResourceType[];
    // Comprova si existeix l'arxiu de configuració del projecte.
    return !!resources.find(d => d.name === 'tsconfig.json');
  }

  /** Instal·la tot el necessari per crear un projecte d'aquest tipus a la carpeta indicada. */
  static createProject(folder: string) {
    // Executem el compilador de Typescript amb l'argument `--init`.
    CodeProject.install(folder, ['tsc --init']);
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
          if (!TypescriptProject.isProjectFolder(this.projectPath)) { Terminal.error(`La carpeta ${Terminal.file(this.projectPath)} no és d'un projecte ${chalk.bold('typescript')}`); }
          // const i: ts.ImportClause;
          // i.

          // Config files.
          Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('tsconfig.json'))} de configuració...`);
          this.tsconfig = Resource.open(this.rootPath('tsconfig.json'));
          Terminal.verbose(`Carregant arxiu ${Terminal.file(chalk.bold('package.json'))} de configuració...`);
          this.package = Resource.open(this.rootPath('package.json'));

          // Nombre del proyecto.
          this.name = this.package && this.package.name ? this.package.name : '';

          resolve(true);

        }).catch(error => reject(error));
      } catch (error) {
        Terminal.error(error);
        reject(error);
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  package.json
  // --------------------------------------------------------------------------------

  incrementPackageVersion() {
    const pkg = Resource.open('package.json');
    const version: string[] = pkg.version.split('.');
    version[2] = `${+version[2] + 1}`;
    pkg.version = version.join('.');
    Terminal.log('Incremented ' + chalk.bold('package.json') + ' patch version to:', Terminal.green(pkg.version));
    Resource.save('package.json', pkg);
  }


  // --------------------------------------------------------------------------------
  //  Dependencies
  // --------------------------------------------------------------------------------

  /** Comprova si el `package.json` conté la dependència indicada. */
  hasDependency(name: string, type?: '--save-prod' | '--save-peer' | '--save-dev'): boolean {
    if (this.package && typeof this.package.dependencies === 'object') {
      return Object.keys(this.package[type === '--save-prod' ? 'dependencies' : (type === '--save-peer' ? 'peerDependencies' : 'devDependencies')]).includes(name);
    }
  }


  // --------------------------------------------------------------------------------
  //  Capacitor
  // --------------------------------------------------------------------------------

  /** Comprovem si el project té instal·lada la plataforma electron. */
  isCapacitorElectron(): boolean {
    // Obtenim el contingut de la carpeta arrel del projecte.
    const resources = Resource.discover(this.projectPath) as ResourceType[];
    // Comprova si existeix una carpeta electron.
    return !!resources.find(r => r.isDirectory && r.name === 'electron');
  }

  /** Comprovem si el project té instal·lada la plataforma ios. */
  isCapacitoriOS(): boolean {
    // Comprovem si té la dependència instal·lada.
    return this.hasDependency('@capacitor/ios', '--save-prod');
  }

  /** Comprovem si el project té instal·lada la plataforma android. */
  isCapacitorAndroid(): boolean {
    // Comprovem si té la dependència instal·lada.
    return this.hasDependency('@capacitor/android', '--save-prod');
  }


  // --------------------------------------------------------------------------------
  //  Imports
  // --------------------------------------------------------------------------------

  /**
   * Afegeix o treu importacions a l'arxiu typescript indicat.
   *
   * ```typescript
   * await project.fileImports('src/app/app.module.ts', [
   *   { action: 'remove', imports: [ 'AppRoutingModule' ], from: './app-routing.module' },
   *   { action: 'add', imports: [ 'Routes' ], from: '@angular/router' },
   * ]);
   * ```
   * @category Command
   */
  fileImports(fileName: string, imports: TypescriptImportType[], fileContent?: string): string {

    const fullName = this.rootPath(fileName);
    if (!fs.existsSync(fullName)) { Terminal.error(`No existeix l'arxiu ${Terminal.file(fileName)}`); return fileContent; }

    if (!fileContent) { Terminal.verbose(`Llegint arxiu ${Terminal.file(fileName)}...`); }
    let content: string = fileContent || fs.readFileSync(fullName, 'utf-8').toString();

    if (imports && imports.length) {
      Terminal.logInline(`Modificant importacions de l'arxiu ${Terminal.file(fileName)}...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fullName, content);
      const replacer: TextReplacer = new TextReplacer(content);

      const declared: any[] = this.getImports(sourceFile);
      const lastImport = declared.length ? declared[declared.length - 1] : undefined;

      // Execute import actions.
      for (const i of imports) {
        // Buscamos todas las importaciones declaradas del módulo actual.
        const found = declared.filter((d: any) => d.from === `'${i.from}'`);
        // Default value.
        if (!i.action) { i.action = 'add'; }

        if (i.action === 'add') {
          if (found.length) {
            const add: any[] = [];
            // Filtramos los specifier que no están en ninguna importación.
            if (found.filter(f => f.imports.includes(i.import)).length === 0) { add.push(i.import); }
            if (add.length) {
              Terminal.success(`Afegint ${chalk.bold(add.join(', '))} a la fila existent de ${chalk.bold(i.from)}`);
              const newImport = `\nimport \{ ${found[0].imports.concat(add).join(', ')} \} from '${i.from}';`;
              replacer.replaceNode(found[0], newImport);

            } else {
              Terminal.verbose(`- Ja existeix la importació de ${chalk.bold(i.from)}`);
            }
          } else {
            Terminal.success(`Afegint fila d'importació per '${chalk.bold(i.from)}'...`);
            const newImport = `\nimport \{ ${i.import} \} from '${i.from}';`;
            replacer.insertAfter(lastImport, newImport);
          }

        } else if (i.action === 'remove') {
          if (found.length) {
            // Repasamos cada import para quitar los imports indicados.
            found.map(f => {
              // Quitamos los specifier que hay que eliminar de la importación.
              const rest: any[] = f.imports.filter((s: any) => !i.import.includes(s));
              const remove: any[] = f.imports.filter((s: any) => i.import.includes(s));
              if (rest.length) {
                Terminal.success(`Eliminant ${chalk.bold(remove.join(', '))} de la fila de ${chalk.bold(i.from)}`);
                const newImport = `\nimport \{ ${rest.join(', ')} \} from '${i.from}';`;
                replacer.replaceNode(f, newImport);
              } else {
                Terminal.success(`Eliminant importació de ${chalk.bold(i.from)}...`);
                replacer.deleteNode(f);
              }
            });
          } else {
            Terminal.verbose(`- Ja no existeix la importació de ${chalk.bold(i.from)}`);
          }
        } else {
          Terminal.warning(`No es reconeix el tipus d'acció '${i.action}' per la importació de ${chalk.bold(i.from)}`);
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
    return TypescriptParser.filter(sourceFile.statements, ts.SyntaxKind.ImportDeclaration, { firstOnly: false }).map((node: ts.Node) => ({
      // // imports: node.importClause.getText().replace('{', '').replace('}', '').split(',').map((e: any) => e.split(' as ')[0].trim()),
      // // NOTA: `propertyName` se establece cuando hay un alias (Ej: HttpClientModule as http)
      imports: (node as ts.ImportDeclaration).importClause.name ? [(node as ts.ImportDeclaration).importClause.name] :
        ((node as ts.ImportDeclaration).importClause.namedBindings as ts.NamedImports).elements.map((e: any) => e.propertyName ? e.propertyName.text : e.name.text),
      from: (node as ts.ImportDeclaration).moduleSpecifier.getText(),
      pos: node.pos,
      end: node.end,
    }));
  }


  // --------------------------------------------------------------------------------
  //  replaces
  // --------------------------------------------------------------------------------

  /** @category Command */
  protected replaces(fileName: string, options: FileOptions): string {
    if (options.replaces && options.replaces.length) {
      fileName = this.relativePath(fileName);
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
            if (action.global === undefined) { action.global = true; }
            if (action.insensitive === undefined) { action.insensitive = false; }
            const flags: string = [action.global ? 'g' : '', action.insensitive ? 'i' : ''].filter(s => !!s).join('');
            Terminal.log(action.description ? '- ' + action.description : `- Substituint l'expressió: ` + chalk.grey(action.match.toString()) + ' (flags:' + flags + ')');
            options.content = options.content.replace(new RegExp(action.match, flags), action.replace || '');
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

  /** Obté el conteingut de l'arxiu indicat i retorna una estructura del codi font `ts.SourceFile`. */
  getSourceFile(fileName: string, content?: string): ts.SourceFile {
    const fullName = this.rootPath(fileName);
    fileName = this.relativePath(fileName);
    const result = TypescriptParser.parse(fullName, content);
    if (!result) { Terminal.error(`No existeix l'arxiu ${Terminal.file(fileName)}`); return undefined; }
    return result;
  }

  /** Obté un parser de TypeScript per manipular el codi font de l'arxiu indicat.
   *
   * ```typescript
   * const parser = project.parseSourceFile('src/app/app.component.ts');
   * const classe = parser.findClassDeclaration('AppComponent');
   * parser.save();
   * ```
   */
  parseSourceFile(fileName: string, content?: string): TypescriptParser {
    const fullName = this.rootPath(fileName);
    fileName = this.relativePath(fileName);
    const parser = new TypescriptParser(fileName, content);
    return parser;
  }

  /** Atraviesa el AST en busca de un nodo con la declaración de la clase indicada. */
  findClassDeclaration(name: string, source: string | ts.SourceFile, throwError = true): ts.ClassDeclaration {
    if (typeof source === 'string') { source = this.getSourceFile(source); }
    const classe = TypescriptParser.find(source, (node: ts.Node): boolean =>
      node.kind === ts.SyntaxKind.ClassDeclaration && (node as ts.ClassDeclaration).name.text === name
    ) as ts.ClassDeclaration;
    if (!classe && throwError) { Terminal.error(`No s'ha trobat la classe '${chalk.bold(name)}'.`, false); return undefined; }
    return classe;
  }

  /** @deprecated */
  saveSourceFile(fileName: string, content: string): void {
    const source = ts.createSourceFile(Resource.normalize(fileName), content, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    const replacements: any[] = [];
    this.normalizeObjectLiteral(source, replacements);
    const replaced = this.aplyReplacements(content, replacements.reverse()).replace(/\n  (?=\w)/g, '\n\n  ');
    fs.writeFileSync(Resource.normalize(fileName), replaced);
  }

  private normalizeObjectLiteral(node: ts.Node, replacements: any[]) {
    if (ts.isPropertyAssignment(node)) {
      const propName = node.getChildren()[0];
      const propValue = node.getChildren()[2];
      if (ts.isStringLiteral(propName)) {
        replacements.push({ start: propName.end - propName.getText().length, end: propName.end, text: propName.text });
      }
      if (ts.isStringLiteral(propValue)) {
        if (propValue.getText().trim().startsWith('"')) {
          replacements.push({ start: propValue.end - propValue.getText().length, end: propValue.end, text: `'${propValue.text}'` });
        }
      }
    }
    node.forEachChild(child => this.normalizeObjectLiteral(child, replacements));
  }

  aplyReplacements(content: string, replacements: any[]) {
    replacements.sort((r1, r2) => r2.start - r1.start).map(r => content = content.slice(0, r.start) + r.text + content.slice(r.end));
    return content;
  }

}
