#!/usr/bin/env node

import * as fs from 'fs'; // const fs = require('fs');
import chalk from 'chalk'; // const chalk = require('chalk');
import * as utils from '@ionic/utils-fs/dist/index.js';
import Prompt from 'commander';
import { exec } from 'child_process'; // const { exec } = require('child_process');
import { CodeProjectConfig, FileOptions, FolderOptions, CloneOptions, CurlOptions, PropertyValue } from './code-types';
import { of } from 'rxjs';
import * as ts from 'typescript';
import * as mysql from 'mysql';
import { TextReplacer, TextReplacement } from './text-replacer';
import { isFunction } from 'util';


// --------------------------------------------------------------------------------
//  CodeProject
// --------------------------------------------------------------------------------

/**
 * Gestiona un projecte de codi typescript.
 *
 * Implementa mètodes per a les principals tasques de scripting:
 *
 * - crear, copiar i eliminar carpetes i arxius del projecte.
 * - substituir o adjuntar contingut en els arxius.
 * - cercar y substituir dins el contingut fent servir expressions regulars.
 * - clonar repositoris a les carpetes del projecte.
 * - executar ordres a la consola.
 *
 * A la ubicació del projecte s'espera trobar un arxiu `precode.json` amb la configuració del projecte.
 * Aquest arxiu ha de tenir l'estructura del tipus `CodeProjectConfig`:
 * ```typescript
 * export interface CodeProjectConfig {
 *   app: { name: string; package: string; };
 *   api?: { url: { dev: string; pro: string; }, version?: string };
 *   git?: { url: string; token?: string; };
 *   dependencies?: ProjectDependency[];
 * }
 *
 * export interface ProjectDependency {
 *   name: string;
 *   url: string;
 *   dependencies: ProjectDependency[];
 * }
 * ```
 *
 * `precode.json`
 * ```json
 * {
 *   "app": {
 *     "name": "test-ionic-project",
 *     "package": "com.test-ionic-project.app"
 *   },
 *   "git": {
 *     "url": "http://gitlab.codi.ovh",
 *     "token": "ZEYAt5UZyeyiZ6PyXBLP"
 *   }
 * }
 * ```
 *
 * Al crear una nova instància s'ha de passar la ubicació del projecte:
 * ```typescript
 * const project: CodeProject = new CodeProject(Prompt.directory);
 * ```
 *
 * **Usage**
 *
 * Exemple de script `ts-node` per inicialitzar un projecte `ionic`:
 * ```typescript
 * const project: CodeProject = new CodeProject(Prompt.directory);
 * const git: CodeProjectConfig['git'] = project.config.git;
 *
 * project.initialize().then(async () => {
 *
 *   await project.execute(`npm i @types/node --save-dev`);
 *
 *   await project.clone({ from: `${git.url}/tools/app-core.git`, to: 'src/app/core' });
 *
 *   await project.move('src/app/home', 'src/app/modules/home');
 *
 *   await project.folder('src/assets/fonts');
 *   await project.file('src/theme/fonts.scss', { content: resource.Fonts });
 *
 * });
 * ```
 *
 * Per executar-lo des del terminal:
 * ```bash
 * npx ts-node ionic/start.ts -d C:\work\apps\test
 * ```
 */
export class CodeProject {

  name: string;
  path: string;
  scriptPath: string;
  config: CodeProjectConfig;
  line = `--------------------------------------------------------------------------------`;
  os: string;

  /** Referencia a la conexión abierta del pool. */
  connection: mysql.Connection | mysql.PoolConnection;


  /** @category Init */
  constructor(path: string, scriptPath: string, os: string, name?: string) {
    try {
      this.path = path;
      this.scriptPath = scriptPath;
      this.os = os || 'linux';
      this.name = name || path.split('/').pop();

      // this.initialize().then(result => {
      //   this.log('Initialized!');
      // });

    } catch (error) {
      this.error(error);
    }
  }

  /**
   * Inicialitza el projecte. Es crida després de crear una nova instància de la classe.
   *
   * **Usage**
   * ```
   * const project: CodeProject = new CodeProject(Prompt.directory, __dirname);
   *
   * project.initialize().then(async () => {
   *
   *  // Les instruccions van aquí.
   *
   * });
   * ```
   * @category Init
   */
  async initialize(): Promise<any> {
    const fileName = 'precode.json';
    try {
      // Project directory
      if (!await utils.pathExists(this.path)) { this.error(`No s'ha trobat la carpeta del projecte '${this.path}'.`); }
      this.log(chalk.bold('Directori del projecte: ') + this.chalkFile(this.path));

      // 'precode.json'
      if (await utils.pathExists(this.path + '/' + fileName)) {
        this.log(`Carregant arxiu de configuració '${this.chalkFile(fileName)}'...`);
        const content: string = await utils.fileToString(this.path + '/' + fileName);
        if (content) {
          try {
            this.config = JSON.parse(content);
          } catch (error) {
            this.error(`Error parsejant l'arxiu de configuració del projecte '${this.chalkFile(fileName)}'.`, false);
            this.error(error);
          }
        } else {
          // this.error(`L'arxiu de configuració '${this.chalkFile(fileName)}' està buit!?!`);
        }
        if (this.config && this.config.git && this.config.git.token && !this.config.git.url.includes(`gitlab-ci-token:`)) {
          const git = this.config.git;
          git.url = git.url.replace(/(http[s]?:\/\/)(.*)/, `\$1gitlab-ci-token:${git.token}\@\$2`);
          this.log(`Tokenitzant la url del git '${chalk.magenta(git.url)}'`);
        }
        if (content) { this.blob(chalk.grey(content)); }
      } else {
        // this.error(`No s'ha trobat l'arxiu de configuració del projecte '${this.chalkFile(fileName)}'.`);
      }

      // utils.readdirp(this.path + '/src/app').then((value: string[]) => {
      //   console.log('dir => ', value);
      // })

    } catch (error) {
      this.error(error);
    }
  }

  /**
   * Instal·la les dependències indicades al directori del projecte.
   *
   * **Usage**
   * ```typescript
   * await project.install([
   *   `npm install @ionic-native/keyboard --save`,
   *   `ionic cordova plugin add cordova-plugin-ionic-keyboard`,
   * ]);
   * ```
   * @category Command
   */
  async install(dependencies: any[]): Promise<any> {
    // Recordamos el directorio actual.
    const curDir = process.cwd();
    // Establecemos el directorio del proyecto como el directorio actual.
    process.chdir(this.path);
    // Install dependencies.
    for (const dep of dependencies) {
      if (typeof dep === 'string') {
        await this.execute(dep);
      } else {
        if (typeof dep === 'function') {
          if (typeof dep.install === 'function') { await dep.install(this); }
        }
      }
    }
    // Restablecemos el directorio actual.
    process.chdir(curDir);
  }

  /**
   * Llegeix el contingut d'un arxiu com a `string`.
   *
   * **Usage**
   * ```
   * const content: string = await project.read(`resources/config.ts`);
   * ```
   *
   * Si no s'indica una ruta absoluta per l'arxiu, per defecte la ruta es pren com a relativa a la carpeta on
   * s'està executant l'script.
   *
   * Per llegir el contingut d'un arxiu relatiu al projecte s'ha d'establir el segon argument.
   * ```typescript
   * const content: string = await project.read(`src/app/config.ts`, 'project');
   * ```
   * @category Command
   */
  async read(fileName: string, rootPath?: 'project' | 'script'): Promise<string> {
    // Si l'arxiu no existeix intentem enrutar-lo.
    const fullName = this.rootPath(fileName, rootPath === 'project' ? this.path : this.scriptPath);
    if (!await utils.pathExists(fullName)) {
      this.error(`No s'ha trobat l'arxiu '${this.chalkFile(fullName)}'...`);
    } else {
      // this.verbose(`Llegint arxiu '${this.chalkFile(fullName)}'...`);
      return utils.fileToString(fullName);
    }
  }

  /** Si la ruta de l'arxiu no és absoluta, s'enruta amb la ubicació del projecte.
   * @category Path
   */
  rootPath(fileName: string, path?: string): string {
    return this.normalizePath(utils.existsSync(fileName) ? fileName : this.pathConcat(path ? path : this.path, fileName));
  }

  /** Encadena amb una barra (`/`) la ruta i l'arxiu indicats.
   * @category Path
   */
  pathConcat(path: string, fileName: string): string {
    if (!path) { return fileName; }
    if (!fileName) { return path; }
    const concat: string = path.endsWith('/') || path.endsWith('\\') ? '' : '/';
    const file = fileName.startsWith('/') || fileName.startsWith('\\') ? fileName.substr(1) : fileName;
    return this.normalizePath(path + concat + file);
  }

  /** Remplaza todos las barras por contrabarras.
   * @category Path
   */
  normalizePath(fileName: string, concat = '\\') {
    return fileName.replace(new RegExp('/', 'g'), concat);
  }

  /**
   * Gesiona el contingut d'un arxiu del projecte.
   *
   * - Si l'arxiu no existeix, el crea.
   * - Si l'arxiu existeix per defecte substitueix el contingut a menys que s'indiqui amb l'opció `appendRatherThanOverwrite` a `true`.
   * - Per defecte, després de suministrar un contingut o fer substitucions l'arxiu es guarda automàticament, a menys que s'estableixi l'opció `saveOnContentChanges` a `false`.
   *
   * **Suministrar contingut**
   *
   * Es pot suministrar un contingut literal o des d'una variable del script.
   * ```typescript
   * await project.file('src/tslint.json', { content: '{"extends": "../tslint.json"}' });
   * ```
   *
   * També es pot obtenir el contingut directamente des d'un arxiu que es troba a la ubicació de l'script en execució.
   * ```typescript
   * await project.file('src/tslint.json', { contentFromFile: 'resources/tslint.json' });
   * ```
   *
   * Aquesta seria una instrucció equivalent a l'anterior:
   * ```typescript
   * await project.file('src/tslint.json', { content: await project.read(`resources/tslint.json`) });
   * ```
   *
   * **Substitucions del contingut**
   *
   * Exemple per fer substitucions al contingut d'un arxiu:
   * ```typescript
   * await project.file('src/app/config.ts', { replaces: [
   *   { match: `{{app.name}}`, replace: app.name, }
   * ] });
   * ```
   *
   * Podem condicionar la substitució pq succeeixi només en cas que no contingui l'expressió indicada:
   * ```typescript
   * await project.file('src/app/config.ts', { replaces: [
   *   description: `Afegint la propietat 'debugEnabled' a sota de 'production'.`,
   *   contains: /debugEnabled/,
   *   match: /(production:\s*(?:true|false))(?:,?)/,
   *   replace: '\$1,\n  debugEnabled: true',
   * ] });
   * ```
   *
   * També es pot suministrar un contingut i inmediatament ordenar unes substitucions:
   * ```typescript
   * await project.file('src/app/config.ts', { content: await project.read(`resources/config.ts`),
   *   replaces: [
   *     { match: `{{app.name}}`, replace: app.name, },
   *     { contains: `(?:package):\s*\'(?:${app.package})\'`, match: `{{app.package}}`, replace: app.package, },
   *   ],
   * });
   * ```
   *
   * **Importacions**
   *
   * Si es tracta d'un arxiu de codi `typescript` podrem afegir o treure importacions:
   * ```typescript
   * await project.file('src/app/app.module.ts', {
   *   imports: [
   *     { action: 'remove', specifiers: [ 'AppRoutingModule' ], source: './app-routing.module' },
   *     { action: 'add', specifiers: [ 'Routes' ], source: '@angular/router' },
   *   ],
   * });
   * ```
   *
   * @param fileName Nom de l'arxiu relatiu a la carpeta del projecte.
   * @param options Opcions de manipulació de l'arxiu.
   * @category Command
   */
  async file(fileName: string, options?: FileOptions): Promise<string> {
    if (!options) { options = {}; }
    if (options.saveOnContentChanges === undefined) { options.saveOnContentChanges = true; }
    if (options.appendRatherThanOverwrite === undefined) { options.appendRatherThanOverwrite = false; }
    options.content = options.content || '';
    if (options.contentFromFile) { options.content = await this.read(options.contentFromFile); }

    const fullName = this.rootPath(fileName);

    try {
      // Content
      if (!await utils.pathExists(fullName)) {
        this.log(`Creant arxiu '${this.chalkFile(fileName)}'...`);

      } else {
        if (!options.content) {
          this.verbose(`Llegint arxiu '${this.chalkFile(fileName)}'...`);
          options.content = await utils.fileToString(fullName);

        } else {
          this.log(`Actualitzant arxiu '${this.chalkFile(fileName)}'...`);
          if (options.appendRatherThanOverwrite) {
            // Append content
            const content: string = await utils.fileToString(fullName) || '';
            options.content = content + '\n' + options.content;
          }
        }
      }

      // Imports
      options.content = this.imports(fileName, options);

      // Replaces
      options.content = this.replaces(fileName, options);

      // Copy
      if (options.copy) {
        this.log(`Copiant arxiu a '${this.chalkFile(options.copy)}'...`);
        fs.writeFileSync(this.pathConcat(this.path, options.copy), options.content);
      }

      // Save
      fs.writeFileSync(fullName, options.content);

      this.blob(chalk.grey(options.content));
      return options.content;

    } catch (error) {
      this.error(error);
    }
  }

  /** @category Command */
  private replaces(fileName: string, options: FileOptions): string {
    if (options.replaces && options.replaces.length) {
      this.log(`Actualitzant codi de l'arxiu '${this.chalkFile(fileName)}'...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fileName, options.content);
      const replacer: TextReplacer = new TextReplacer(options.content);

      // Execute replaces.
      for (const action of options.replaces) {
        let descartado = false;
        if (!!action.contains) {
          if (typeof action.contains === 'string') { action.contains = new RegExp(action.contains); }
          if (action.contains.test(options.content)) {
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

  /** @category Command */
  private imports(fileName: string, options: FileOptions): string {
    if (options.imports && options.imports.length) {
      this.log(`Modificant importacions de l'arxiu '${this.chalkFile(fileName)}'...`);

      const sourceFile: ts.SourceFile = this.getSourceFile(fileName, options.content);
      const replacer: TextReplacer = new TextReplacer(options.content);

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
      for (const i of options.imports) {
        // Buscamos todas las importaciones declaradas del módulo actual.
        const found = declared.filter((d: any) => d.source === `'${i.source}'`);
        // Default value.
        if (!i.action) { i.action = 'add'; }

        if (i.action === 'add') {
          if (found.length) {
            const add: any[] = [];
            // Filtramos los specifier que no están en ninguna importación.
            i.specifiers.map(s => { if (found.filter(f => f.specifiers.includes(s)).length === 0) { add.push(s); } });
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
      options.content = replacer.apply();

    } else {
      // this.verbose(`No s'ha definit cap importació per a l'arxiu '${this.chalkFile(fileName)}'.`);
    }
    return options.content;
  }

  /**
   * Crea o elimina una carpeta del projecte.
   *
   * **Usage**
   *
   * Si no existeix, crea una nova carpeta a la ubicació del projecte.
   * ```typescript
   * await project.folder('src/app/global');
   * await project.folder('src/app/global', { action: 'add' });
   * ```
   *
   * Si existeix, elimina una carpeta del projecte.
   * ```typescript
   * await project.folder('src/app/global'. { action: 'remove' });
   * ```
   *
   * La instrucció anterior és equivalent a utilitzar la funció `remove()`:
   * ```typescript
   * await project.remove('src/app/global');
   * ```
   * @category Command
   */
  async folder(folderName: string, options?: FolderOptions): Promise<any> {
    if (!options) { options = {}; }
    if (!options.action) { options.action = 'add'; }

    const fullName = this.rootPath(folderName);

    if (await utils.pathExists(fullName)) {
      if (options.action === 'remove') {
        this.log(`Eliminant la carpeta '${this.chalkFile(folderName)}'...`);
        const command = `rm -Rf ${fullName}`;
        return await this.execute(command);

      } else {
        this.verbose(`Ja existeix la carpeta '${this.chalkFile(folderName)}'`);
        return true;
      }

    } else {
      if (options.action === 'add') {
        this.log(`Creant la carpeta '${this.chalkFile(folderName)}'...`);
        const command = `mkdir ${fullName}`;
        return await this.execute(command);

      } else if (options.action === 'remove') {
        this.log(`La carpeta ja estava eliminada '${this.chalkFile(folderName)}'`);
        return true;

      } else {
        this.warning(`No es reconeix el tipus d'acció '${options.action}' per la carpeta '${this.chalkFile(folderName)}'`);
        return false;
      }
    }
  }

  /**
   * Executa una ordre git per clonar un repositori a la ubicació indicada.
   *
   * ```typescript
   * await project.clone({
   *   from: `tools/app-core.git`,
   *   to: 'src/app/core'
   * });
   * ```
   * Si el path `from` és relatiu llavors s'enruta amb `project.config.git.url` per defecte.
   *
   * La crida anterior executaria una ordre com la següent:
   * ```bash
   * git clone https://gitlab-ci-token:TOKEN@gitlab.codi.ovh/tools/app-core src/app/core
   * ```
   * @param options Parametrización del comando clone.
   * @category Command
   */
  async clone(options: CloneOptions): Promise<any> {
    // git clone https://gitlab-ci-token:TOKEN@gitlab.codi.ovh/tools/app-core src/app/core
    const from = options.from.startsWith('http') ? options.from : `${this.config.git.url}/${options.from}`;
    const to = this.rootPath(options.to);
    if (options.removePreviousFolder === undefined) { options.removePreviousFolder = true; }
    if (options.removePreviousFolder && await utils.pathExists(to)) {
      // Remove directory before clone.
      await this.remove(options.to);
    }
    const command = `git clone ${from} ${to}`;
    this.log(`Clonant repositori '${this.chalkFile(from.replace(`gitlab-ci-token:${this.config.git.token}@`, ''))}'...`);
    return await this.execute(command);
  }

  /**
   * Executa una ordre curl.
   *
   * ```typescript
   * await project.curl({
   *   method: 'GET',
   *   headers: { 'PRIVATE-TOKEN': project.config.git.token },
   *   url: `${project.config.git.url}/tools/app-core`,
   *   to: 'src/app/core',
   * });
   * ```
   *
   * La crida anterior executaria una ordre com la següent:
   * ```bash
   * curl -sb --request GET --header 'PRIVATE-TOKEN: TOKEN' https://gitlab.codi.ovh/tools/app-core src/app/core
   * ```
   * @param options Parametrización del comando curl.
   * @category Command
   */
  async curl(options: CurlOptions): Promise<string> {
    if (options.headers === undefined) { options.headers = [] as any; }
    // curl -sb --request GET --header 'PRIVATE-TOKEN: $GITLAB_PRIVATE_TOKEN' https://gitlab.codi.ovh/tools/app-core src/app/core
    const method = options.method || 'GET';
    //// Ex: headers: [{ name: 'PRIVATE-TOKEN', value: project.config.git.token }]
    // const headers = options.headers.map((h: PropertyValue) => `--header '${h.name}: ${h.value}'`).join(' ') || '';
    // Ex: headers: { 'PRIVATE-TOKEN': project.config.git.token }
    const headers = Object.keys(options.headers).map(prop => `--header '${prop}: ${options.headers[prop]}'`).join(' ') || '';
    const url = options.url || '';
    const to = this.rootPath(options.to);
    const command = `curl -sb --request ${method} ${headers} ${url} ${to}`;
    this.log(`Curl ${method} '${this.chalkFile(url.replace(`--header 'PRIVATE-TOKEN: ${this.config.git.token}`, ''))}'...`);
    return await this.execute(command);
  }

  /**
   * Mou un arxiu o carpeta d'una ubicació a l'altre del projecte.
   *
   * **Usage**
   * ```typescript
   * await project.move('src/app/home', 'src/app/modules/home');
   * ```
   *
   * Internament s'executa al terminal la següent instrucció:
   * ```bash
   * mv C:/my-project-path/src/app/home C:/my-project-path/src/app/modules/home
   * ```
   * @param fromPath Ubicació d'origen
   * @param toPath Ubicació de destí
   * @category Command
   */
  async move(fromPath: string, toPath: string): Promise<any> {
    const from = this.rootPath(fromPath);
    const to = this.rootPath(toPath);
    if (!await utils.pathExists(from)) {
      if (!await utils.pathExists(to)) {
        this.warning(`No s'ha trobat la carpeta d'origen '${this.chalkFile(fromPath)}'.`);
      } else {
        this.verbose(`La carpeta ja estava moguda a '${this.chalkFile(fromPath)}'.`);
      }
    } else {
      const command = this.os === 'linux' ? `mv ${from} ${to}` : `move ${from} ${to}`;
      this.log(`Movent de '${this.chalkFile(fromPath, toPath)}' fins a ${this.chalkFile(toPath, fromPath)}'...`);
      return await this.execute(command);
    }
  }

  /**
   * Elimina un arxiu o una carpeta del projecte.
   *
   * **Usage**
   *
   * Eliminar un arxiu.
   * ```typescript
   * await project.remove('src/app/app-routing.module.ts');
   * ```
   *
   * Eliminar una carpeta.
   * ```typescript
   * await project.remove('src/app/list');
   * ```
   *
   * Internament s'executa al terminal la següent instrucció:
   * ```bash
   * rm -Rf C:/my-project-path/src/app/list
   * ```
   * @param name Nom de l'arxiu del projecte que es vol eliminar.
   * @category Command
   */
  async remove(name: string): Promise<any> {
    const fullName = this.rootPath(name);
    if (await utils.pathExists(fullName)) {
      const stat = fs.lstatSync(fullName);
      if (stat.isFile()) {
        // File
        const command = this.os === 'linux' ? `rm -Rf ${fullName}` : `del "${fullName}"`;
        this.log(`Eliminant '${this.chalkFile(name)}'...`);
        return await this.execute(command);

      } else {
        // Folder
        const command = this.os === 'linux' ? `rm -Rf ${fullName}` : `rmdir /Q /S "${fullName}"`;
        this.log(`Eliminant '${this.chalkFile(name)}'...`);
        return await this.execute(command);
      }

    } else {
      this.verbose(`La carpeta no existeix '${this.chalkFile(fullName)}'.`);
      return await of().toPromise();
    }
  }

  /** Executa una ordre directament al terminal.
   * @category Command
   */
  async execute(command: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.log(`${chalk.blue(command)}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.error(error);
          reject(false);

        } else {
          if (stdout) { this.log(stdout); }
          if (stderr) { this.log(chalk.yellow(`${stderr}`)); }
          resolve(true);
        }
      });
    });
  }


  // --------------------------------------------------------------------------------
  //  Abstract Syntax Tree
  // --------------------------------------------------------------------------------

  /** Obtiene el contenido del archivo indicado y devuelve una estructura de código fuente `ts.SourceFile`. */
  getSourceFile(fileName: string, content?: string): ts.SourceFile {
    return ts.createSourceFile(fileName, content || fs.readFileSync(fileName, 'utf-8'), ts.ScriptTarget.Latest, true);
  }

  /** Atraviesa el AST en busca de un nodo con la declaración de la clase indicada. */
  getClassDeclaration(name: string, source: any, throwError = true): ts.ClassDeclaration {
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


  // --------------------------------------------------------------------------------
  //  MySQL
  // --------------------------------------------------------------------------------

  /**
   * Abre un pool para la ejecución de múltiples consultas durante el script.
   * ```typescript
   * await project.connect({
   *   connectionLimit : 10,
   *   host: 'db.myhost.com',
   *   user: 'myuser',
   *   password: '1234',
   *   database: 'mydatabase'
   * });
   * ```
   *
   * Al terminar la última consulta debería liberarse la conexión:
   * ```typescript
   * con.release();
   * ```
   */
  async connect(config: string | mysql.ConnectionConfig | mysql.PoolConfig): Promise<mysql.Connection | mysql.PoolConnection> {
    return new Promise<any>((resolve: any, reject: any) => {
      const pool: mysql.Pool = mysql.createPool(config);
      pool.getConnection(async (err: mysql.MysqlError, connection: mysql.PoolConnection) => {
        if (err) { reject(err); }
        // Referenciamos la conexión para ejecutar futuras consultas.
        this.connection = connection;
        this.verbose('MySQL connected!');
        resolve(connection);
      });
    });
  }

  /** Ejecuta una consulta a través de la conexión actual.  */
  async query(sql: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (!this.connection) { this.error('No hay ninguna conexión abierta.'); }
      this.connection.query(sql, (err, results) => {
        if (err) { reject(err); }
        resolve(results);
      });
    });
  }

  /** Cierra la conexión actual. */
  async closeConnection() {
    if (this.connection) {
      if (typeof (this.connection as any).release === 'function') {
        (this.connection as mysql.PoolConnection).release();
        this.verbose('MySQL connection closed!');
      } else if (typeof (this.connection as any).end === 'function') {
        (this.connection as mysql.Connection).end();
        this.verbose('MySQL connection closed!');
      }
    }
  }

  // --------------------------------------------------------------------------------
  //  Log & Error
  // --------------------------------------------------------------------------------

  /** @category Log */
  log(message: string, data?: any) {
    // if (Prompt.verbose) {
      if (data === undefined) {
        console.log(message);
      } else {
        console.log(message, data);
      }
    // }
  }

  /** @category Log */
  verbose(message: string, data?: any) {
    if (Prompt.verbose) {
      if (data === undefined) {
        console.log(message);
      } else {
        console.log(message, data);
      }
    }
  }

  /** @category Log */
  blob(content: string) {
    if (Prompt.verbose) {
      console.log(this.line + '\n' + content + this.line);
    }
  }

  /** @category Log */
  warning(message: string): void {
    console.log(chalk.bold.yellow('WARN: ') + chalk.yellow(message) + '\n');
  }

  /** @category Log */
  error(error: any, exit = true): void {
    const message = typeof error === 'string' ? error : error.error || error.message || 'Error desconegut';
    console.log(chalk.bold.red('ERROR: ') + chalk.red(message) + (exit ? `\n\n${this.line}\n` : ''));
    if (exit) { process.exit(1); }
  }

  /** @category Log */
  chalkFile(fileName: string, relativeTo?: string): string {
    const i = relativeTo ? this.relative(fileName, relativeTo) : fileName.lastIndexOf('/');
    if (i > 0) {
      const base = fileName.substr(0, i + 1);
      const name = fileName.substr(i + 1);
      // return chalk.blue(base) + chalk.bold.blue(name);
      return chalk.green(base) + chalk.bold.green(name);

    } else {
      // return chalk.cyan(fileName);
      return chalk.green(fileName);
    }
  }

  /** @category Log */
  relative(from: string, to: string) {
    let i = 0;
    while (i < Math.min(from.length, to.length)) {
      if (from.charAt(i) !== to.charAt(i)) { return i - 1; }
      i++;
    }
    return i - 1;
  }

}

