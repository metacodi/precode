#!/usr/bin/env node

import * as fs from 'fs';
import * as utils from '@ionic/utils-fs/dist/index.js';
import * as path from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';
import { FileOptions, FolderOptions, CloneOptions, CurlOptions, DeploymentOptions } from './types';
import { of } from 'rxjs';
import * as mysql from 'mysql';
import { Terminal } from '../utils/terminal';
import { Resource, ResourceType } from '../utils/resource';
import { CodeDeployment } from '../deployments/abstract/code-deployment';



// --------------------------------------------------------------------------------
//  CodeProject
// --------------------------------------------------------------------------------

/**
 * Gestiona un projecte de codi typescript, php, etc.
 *
 * Implementa mètodes per a les principals tasques de scripting:
 *
 * - crear, copiar i eliminar carpetes i arxius del projecte.
 * - substituir o adjuntar contingut en els arxius.
 * - cercar y substituir dins el contingut fent servir expressions regulars.
 * - clonar repositoris a les carpetes del projecte.
 * - executar ordres a la consola.
 *
 * **Usage**
 *
 * Exemple de script per a `ts-node` que modifica un projecte:
 * ```typescript
 * #!/usr/bin/env node
 * /// <reference types="node" />
 *
 * import { CodeProject } from '@metacodi/precode';
 * import Prompt from 'commander';
 *
 * Prompt
 *   .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
 *   .option('-s, --system <system>', 'Sistema operativo: windows | linux')
 *   .option('-v, --verbose', 'Log verbose')
 *   ;
 * Prompt.parse(process.argv);
 *
 * const project: CodeProject = new CodeProject(Prompt.directory, __dirname, Prompt.system);
 * const git = { "url": "http://gitlab.codi.ovh", "token": "ZEYAt5UZyeyiZ6PyXBLP" }
 *
 * project.initialize().then(async () => {
 *   // Instal·la un package al projecte.
 *   await project.install(`npm i @types/node --save-dev`);
 *   // Clona un repositori a dins d'una carpeta del projecte.
 *   await project.clone({ from: `${git.url}/tools/app-core.git`, to: 'src/app/core' });
 *   // Mou una carpeta del projecte.
 *   await project.move('src/app/home', 'src/app/modules/home');
 *   // Crea una carpeta.
 *   await project.folder('src/assets/fonts');
 *   // Crea un fitxer (si no existeix) i n'estableix el seu contingut.
 *   await project.file('src/theme/fonts.scss', { content: resource.Fonts });
 * });
 * ```
 *
 * Per executar un script des del terminal:
 * ```bash
 * npx ts-node my-script.ts -d C:\apps\test
 * ```
 */
export class CodeProject {

  /** Nom del projecte */
  name: string;
  /** Carpeta del projecte. */
  projectPath: string;
  /** Ubicació de l'script des d'on s'executa la instància de la clase. */
  scriptPath: string;
  /** @deprecated */
  config: any;
  /** Indica el sistema operatiu actual. */
  os: string;
  // /** Debug helper */
  // line = `--------------------------------------------------------------------------------`;
  /** Referència a la connexió mysql oberta. */
  connection: mysql.Connection | mysql.PoolConnection;

  /** Executa una ordre directament al terminal.
   * @category Command
   */
  static async execute(command: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      Terminal.log(`${chalk.blue(command)}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          Terminal.error(error);
          reject(false);

        } else {
          if (stdout) { Terminal.log(stdout); }
          if (stderr) { Terminal.log(chalk.yellow(`${stderr}`)); }
          resolve(true);
        }
      });
    });
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
  static async install(folder: string, dependencies: any[]): Promise<any> {
    // Recordamos el directorio actual.
    const curDir = process.cwd();
    // Establecemos el directorio del proyecto como el directorio actual.
    process.chdir(folder);
    // Install dependencies.
    for (const dep of dependencies) {
      if (typeof dep === 'string') {
        await CodeProject.execute(dep);
      }
    }
    // Restablecemos el directorio actual.
    process.chdir(curDir);
  }


  // --------------------------------------------------------------------------------
  //  constructor . initialize
  // --------------------------------------------------------------------------------

  /** @category Init */
  constructor(projectPath: string, scriptPath: string, os?: string, name?: string) {
    try {
      this.projectPath = projectPath;
      this.scriptPath = scriptPath;
      this.os = os || 'linux';
      this.name = name || this.projectPath.split('/').pop();

      // this.initialize().then(result => {
      //   Terminal.log('Initialized!');
      // });

    } catch (error) {
      Terminal.error(error);
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
    return new Promise<any>((resolve: any, reject: any) => {
      try {
        // Project directory
        if (!fs.existsSync(this.projectPath)) { Terminal.error(`No s'ha trobat la carpeta del projecte ${chalk.bold(this.projectPath)}`); reject(); }
        Terminal.log(chalk.bold('Directori del projecte: ') + Terminal.file(this.projectPath));

        // if (this.config && this.config.git && this.config.git.token && !this.config.git.url.includes(`gitlab-ci-token:`)) {
        //   const git = this.config.git;
        //   git.url = git.url.replace(/(http[s]?:\/\/)(.*)/, `\$1gitlab-ci-token:${git.token}\@\$2`);
        //   Terminal.log(`Tokenitzant la url del git '${chalk.magenta(git.url)}'`);
        // }

        resolve(true);

      } catch (error) {
        Terminal.error(error);
        reject(error);
      }
    });
  }


  // --------------------------------------------------------------------------------
  //  Scripting tasks
  // --------------------------------------------------------------------------------

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
    return CodeProject.install(this.projectPath, dependencies);
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
  async read(fileName: string, fromPath?: 'project' | 'script'): Promise<string> {
    // Si l'arxiu no existeix intentem enrutar-lo.
    const fullName = this.rootPath(fileName, fromPath === 'project' ? this.projectPath : this.scriptPath);
    if (!await utils.pathExists(fullName)) {
      Terminal.error(`No s'ha trobat l'arxiu '${Terminal.file(fullName)}'...`);
    } else {
      // Terminal.verbose(`Llegint arxiu '${Terminal.file(fullName)}'...`);
      return utils.fileToString(fullName);
    }
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
   * await project.fileImports('src/app/app.module.ts', [
   *   { action: 'remove', specifiers: [ 'AppRoutingModule' ], module: './app-routing.module' },
   *   { action: 'add', specifiers: [ 'Routes' ], module: '@angular/router' },
   * ]);
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
        Terminal.success(`Creant arxiu '${Terminal.file(fileName)}'.`);

      } else {
        if (!options.content) {
          Terminal.verbose(`Llegint arxiu '${Terminal.file(fileName)}'.`);
          options.content = await utils.fileToString(fullName);

        } else {
          Terminal.success(`Actualitzant arxiu '${Terminal.file(fileName)}'.`);
          if (options.appendRatherThanOverwrite) {
            // Append content
            const content: string = await utils.fileToString(fullName) || '';
            options.content = content + '\n' + options.content;
          }
        }
      }

      // // Imports
      // options.content = this.imports(fileName, options);

      // Replaces
      options.content = this.replaces(fileName, options);

      // Copy
      if (options.copy) {
        Terminal.success(`Copiant arxiu a '${Terminal.file(options.copy)}'.`);
        fs.writeFileSync(Resource.concat(this.projectPath, options.copy), options.content);
      }

      // Save
      fs.writeFileSync(fullName, options.content);

      Terminal.blob(chalk.grey(options.content));
      return options.content;

    } catch (error) {
      Terminal.error(error);
    }
  }

  /** Comprova si existeix el recurs en el proijecte. */
  exists(fileName: string): boolean {
    return Resource.isAccessible(this.rootPath(fileName));
  }

  /** @category Command */
  protected replaces(fileName: string, options: FileOptions): string {
    if (options.replaces && options.replaces.length) {
      Terminal.log(`Actualitzant codi de l'arxiu '${Terminal.file(fileName)}'.`);

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
            // For inherited classes that use AST for replacements.
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
    const exists = await utils.pathExists(fullName);

    if (await utils.pathExists(fullName)) {
      if (options.action === 'remove') {
        Terminal.success(`  Eliminant la carpeta '${Terminal.file(folderName)}'.`);
        const command = process.platform === 'win32' ? `rmdir /S /Q "${fullName}"` : `rm -Rf ${fullName}`;
        return await this.execute(command);

      } else {
        Terminal.verbose(`- Ja existeix la carpeta '${Terminal.file(folderName)}'`);
        return true;
      }

    } else {
      if (options.action === 'add') {
        Terminal.success(`  Creant la carpeta '${Terminal.file(folderName)}'.`);
        const command = process.platform === 'win32' ? `mkdir "${fullName}"` : `mkdir ${fullName}`;
        return await this.execute(command);

      } else if (options.action === 'remove') {
        Terminal.success(`  La carpeta ja estava eliminada '${Terminal.file(folderName)}'`);
        return true;

      } else {
        Terminal.warning(`- No es reconeix el tipus d'acció '${options.action}' per la carpeta '${Terminal.file(folderName)}'`);
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

    const git = { url: this.config.git.url, token: this.config.git.token };

    // git clone https://gitlab-ci-token:TOKEN@gitlab.codi.ovh/tools/app-core src/app/core
    const from = options.from.startsWith('http') ? options.from : `${git.url}/${options.from}`;
    const to = this.rootPath(options.to);
    if (options.removePreviousFolder === undefined) { options.removePreviousFolder = true; }
    if (options.removePreviousFolder && await utils.pathExists(to)) {
      // Remove directory before clone.
      await this.remove(options.to);
    }
    const command = `git clone ${from} ${to}`;
    Terminal.log(`Clonant repositori '${Terminal.file(from.replace(`gitlab-ci-token:${git.token}@`, ''))}'...`);
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
    const token = this.config.git.token;

    // curl -sb --request GET --header 'PRIVATE-TOKEN: $GITLAB_PRIVATE_TOKEN' https://gitlab.codi.ovh/tools/app-core src/app/core
    const method = options.method || 'GET';
    //// Ex: headers: [{ name: 'PRIVATE-TOKEN', value: project.config.git.token }]
    // const headers = options.headers.map((h: PropertyValue) => `--header '${h.name}: ${h.value}'`).join(' ') || '';
    // Ex: headers: { 'PRIVATE-TOKEN': project.config.git.token }
    const headers = Object.keys(options.headers).map(prop => `--header '${prop}: ${options.headers[prop]}'`).join(' ') || '';
    const url = options.url || '';
    const to = this.rootPath(options.to);
    const command = `curl -sb --request ${method} ${headers} ${url} ${to}`;
    Terminal.log(`Curl ${method} '${Terminal.file(url.replace(`--header 'PRIVATE-TOKEN: ${token}`, ''))}'...`);
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
        Terminal.warning(`No s'ha trobat la carpeta d'origen '${Terminal.file(fromPath)}'.`);
      } else {
        Terminal.verbose(`La carpeta ja estava moguda a '${Terminal.file(fromPath)}'.`);
      }
    } else {
      const command = process.platform === 'win32' ? `move "${from}" "${to}"` : `mv ${from} ${to}`;
      Terminal.log(`Movent de '${Terminal.file(fromPath, toPath)}' fins a ${Terminal.file(toPath, fromPath)}'...`);
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
        const command = process.platform === 'win32' ? `del "${fullName}"` : `rm -Rf ${fullName}`;
        Terminal.log(`Eliminant '${Terminal.file(name)}'...`);
        return await CodeProject.execute(command);

      } else {
        // Folder
        const command = process.platform === 'win32' ? `rmdir /Q /S "${fullName}"` : `rm -Rf ${fullName}`;
        Terminal.log(`Eliminant '${Terminal.file(name)}'...`);
        return await CodeProject.execute(command);
      }

    } else {
      Terminal.verbose(`La carpeta no existeix '${Terminal.file(fullName)}'.`);
      return await of().toPromise();
    }
  }

  /** Executa una ordre directament al terminal.
   * @category Command
   */
  async execute(command: string): Promise<any> {
    return CodeProject.execute(command);
  }


  // --------------------------------------------------------------------------------
  //  File system
  // --------------------------------------------------------------------------------

  /** Si la ruta de l'arxiu no és absoluta, s'enruta amb la ubicació del projecte.
   * @category Path
   */
  rootPath(fileName: string, folder?: string): string {
    if (path.isAbsolute(fileName)) {
      return fileName;

    } else {
      if (folder) { fileName = Resource.normalize(path.join(folder, fileName)); }
      return Resource.normalize(Resource.concat(this.projectPath, fileName));
    }
    // console.log('rootPath => ', {
    //   fileName,
    //   folder,
    //   'this.projectPath': this.projectPath,
    //   'Resource.concat(folder, fileName)': Resource.concat(folder, fileName),
    //   'Resource.concat(this.projectPath, fileName)': Resource.concat(this.projectPath, fileName),
    //   'Resource.isAccessible(Resource.concat(folder, fileName))': Resource.isAccessible(Resource.concat(folder, fileName)),
    //   'Resource.isAccessible(Resource.concat(this.projectPath, fileName))': Resource.isAccessible(Resource.concat(this.projectPath, fileName)),
    //   'Resource.normalize(fileName)': Resource.normalize(fileName),
    // });
    // if (!!folder && Resource.isAccessible(Resource.concat(folder, fileName))) { return Resource.normalize(Resource.concat(folder, fileName)); }
    // if (Resource.isAccessible(Resource.concat(this.projectPath, fileName))) { return Resource.normalize(Resource.concat(this.projectPath, fileName)); }
    // const normalized = Resource.normalize(fileName);
    // return Resource.normalize(fileName);
    // // return Resource.normalize(utils.existsSync(fileName) ? fileName : Resource.concat(folder ? folder : this.projectPath, fileName));
  }


  // --------------------------------------------------------------------------------
  //  MySQL
  // --------------------------------------------------------------------------------

  /**
   * Obre un pool i obté una connexió que es pot aprofitar per a executar múltiples consultes.
   * ```typescript
   * const con = await project.connect({
   *   connectionLimit : 10,
   *   host: 'db.myhost.com',
   *   user: 'myuser',
   *   password: '1234',
   *   database: 'mydatabase'
   * });
   * ```
   *
   * En acabat s'hauria d'alliberar la connexió del pool:
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
        Terminal.verbose('MySQL connected!');
        resolve(connection);
      });
    });
  }

  /** Executa una consulta a través de la connexió actual.  */
  async query(sql: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (this.connection) {
        this.connection.query(sql, (err, results) => {
          if (err) { reject(err); }
          resolve(results);
        });

      } else {
        const error = 'No hi ha cap connexió oberta disponible.';
        Terminal.error(error);
        reject(error);
      }
    });
  }

  /** Tanca la connexió actual. */
  async closeConnection() {
    if (this.connection) {
      if (typeof (this.connection as any).release === 'function') {
        (this.connection as mysql.PoolConnection).release();
        Terminal.verbose('MySQL connection closed!');
      } else if (typeof (this.connection as any).end === 'function') {
        (this.connection as mysql.Connection).end();
        Terminal.verbose('MySQL connection closed!');
      }
    }
  }

}

