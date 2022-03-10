import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { Terminal } from './terminal';


export interface ResourceType {
  name: string;
  path: string;
  fullName: string;
  size?: number;
  created?: Date;
  modified?: Date;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  children?: ResourceType[];
}

/**
 *
 */
export class Resource {

  /** Encadena amb una barra (`/`) la ruta i l'arxiu indicats.
   * @category Path
   */
  static concat(folder: string, fileName: string): string {
    if (!folder) { return fileName; }
    if (!fileName) { return folder; }
    const concat = (folder.endsWith('/') || folder.endsWith('\\')) ? '' : '/';
    const file = (fileName.startsWith('/') || fileName.startsWith('\\')) ? fileName.substring(1) : fileName;
    return Resource.normalize(folder + concat + file);
  }

  /** Substitueix totes les barres per contra-barres.
   * @category Path
   */
   static normalize(fileName: string): string {
    const find = process.platform === 'win32' ? '/' : '\\\\';
    // const replace = process.platform === 'win32' ? '\\' : '/';
    const replace = Resource.platformPathSeparator;
    return fileName.replace(new RegExp(find, 'g'), replace);
  }

  /** Retorna un array amb els segments del camí indicat.
   * @category Path
   */
  static split(path: string): string[] {
    return Resource.normalize(path).replace('\\', '/').split('/');
  }

  /** Retorna un camí a partir dels seus segments normalitzat per la plataforma actual.
   * @category Path
   */
  static join(path: string[]): string {
    return Resource.normalize(path.join('/'));
  }

  /** Obté el caràcter separador de carpetes que fa servir la plataforma actual.
   * @category Path
   */
  static get platformPathSeparator(): string {
    return process.platform === 'win32' ? '\\' : '/';
  }

  /**
   * Llegeix el contingut d'un arxiu i intenta parsejar-lo comprovant l'extensió.
   *
   * Per exemple, si l'arxiu és un de tipus `json` aleshores es retorna el resultat de
   * `JSON.parse(content)`
   */
  static open(fileName: string, options?: { parseJsonFile?: boolean }): any {
    if (!options) { options = {}; }
    const parseJsonFile = options.parseJsonFile === undefined ? true : options.parseJsonFile;

    // Obtenim el contingut de l'arxiu.
    let content = fs.readFileSync(fileName, { encoding: 'utf8' }).toString();

    // Parsejem el contingut.
    const file = Resource.discover(fileName) as ResourceType;
    if (parseJsonFile && file.extension === '.json') {
      try {
        if (file.name.startsWith('tsconfig')) {
          // Remove comments.
          content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
          // Eliminem la coma de la darrera propietat d'un objecte literal.
          content = content.replace(/\,[\s]*\}/gm, '}');
          // Eliminem la coma del darrer element d'un array.
          content = content.replace(/\,[\s]*\]/gm, ']');
        }
        return JSON.parse(content);

      } catch (err) {
        Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
        return undefined;
      }
    }
    return content;
  }

  /**
   * Guarda el contingut en l'arxiu i intenta formatejar-lo abans comprovant l'extensió.
   *
   * Per exemple, si l'arxiu és un de tipus `json` aleshores abans es guardar
   * el contingut es transforma fent `JSON.stringify(content)`
   */
  static save(fileName: string, content: any, options?: fs.WriteFileOptions): boolean {
    try {
      if (!options) { options = {}; }

      if (Resource.exists(fileName)) {
        // Parsejem el contingut.
        const file = Resource.discover(fileName) as ResourceType;
        if (file.extension === '.json' && typeof content === 'object') {
          content = JSON.stringify(content, null, 2);
        }
      }

      fs.writeFileSync(fileName, content, options);
      return true;

    } catch (err) {
      Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
      return false;
    }
  }

  /** Indica si un recurs existeix. */
  static exists(resource: string): boolean {
    try { return fs.existsSync(resource); } catch (err) { return false; }
  }
  /** Indica si un recurs existeix i a més és accessible. */
  static isAccessible(resource: string): boolean {
    try { fs.accessSync(resource, fs.constants.F_OK); return true; } catch (err) { return false; }
  }
  /** Indica si l'usuari actual té permisos de lectura sobre el recurs. */
  static isReadable(resource: string): boolean {
    try { fs.accessSync(resource, fs.constants.R_OK); return true; } catch (err) { return false; }
  }
  /** Indica si l'usuari actual té permisos d'escritura sobre el recurs. */
  static isWriteable(resource: string): boolean {
    try { fs.accessSync(resource, fs.constants.W_OK); return true; } catch (err) { return false; }
  }
  /** Indica si el recurs només es pot llegir, però no modificar. */
  static isReadOnly(resource: string): boolean {
    return this.isAccessible(resource) && this.isReadable(resource) && !this.isWriteable(resource);
  }

  /**
   * Obté informació detallada de les carpetes i els arxius del directori actual.
   * ```typescript
   * const info: ResourceType = Resource.discover(path.join(Prompt.directory, 'tsconfig.json'));
   * ```
   * Valor retornat:
   * ```json
   * {
   *   "name": "tsconfig.json",
   *   "path": "C:/Users/Jordi/work/metacodi/tools/meta-model",
   *   "fullName": "C:/Users/Jordi/work/metacodi/tools/meta-model/tsconfig.json",
   *   "isDirectory": false,
   *   "isFile": true,
   *   "extension": ".json",
   *   "size": 1035,
   *   "created": "2020-06-15T13:37:16.891Z",
   *   "modified": "2020-06-18T10:59:27.228Z"
   * }
   * ```
   * @param resource Ruta absoluta del recurs que es vol explorar.
   * @param ignore Expressió regular per escloure arxius i carpetes.
   * @param recursive Realitza crides recursives fins descobrir tots els recursos de dins les sub-carpetes.
   */
  static discover(resource: string, options?: { ignore?: string | RegExp, filter?: string | RegExp, recursive?: boolean }, indent = ''): ResourceType | ResourceType[] {
    if (!options) { options = {}; }
    if (options.ignore === undefined) { options.ignore = 'node_modules|\.git'; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (!!options.ignore && typeof options.ignore === 'string') { options.ignore = new RegExp(options.ignore); }
    if (!!options.filter && typeof options.filter === 'string') { options.filter = new RegExp(options.filter); }

    if (!fs.existsSync(resource) || !Resource.isAccessible(resource)) { Terminal.error(`No existeix el recurs '${Terminal.file(resource)}'`); return []; }

    const content: ResourceType[] = [];
    const resourceIsDirectory = fs.lstatSync(resource).isDirectory();
    // NOTA: Si el recurs és la unitat, afegim una barra pq sinó accedirà a la carpeta actual process.cwd() i no trobarà aquests arxius a l'arrel de la unitat.
    if (resource.length === 2 && resource.endsWith(':')) resource = resource + (process.platform === 'win32' ? '\\' : '/');
    const resources: string[] = resourceIsDirectory ? fs.readdirSync(resource) : [ path.basename(resource) ];
    resource = resourceIsDirectory ? resource : path.dirname(resource);

    for (const name of Object.values(resources)) {
      const fullName = path.join(resource, name);
      try {
        // NOTA: Encara que sigui accessible, no podem recuperar el seu status si no ho permeten els permisos.
        const accessible = Resource.isAccessible(fullName);
        const filtered = !options.filter || (options.filter as RegExp).test(name);
        const accepted = !options.ignore || !(options.ignore as RegExp).test(name);
        if (accessible && accepted && filtered) {
          const stat: fs.Stats = fs.statSync(fullName);
          const info: ResourceType = {
            name,
            path: resource,
            fullName,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile(),
            extension: stat.isDirectory() ? '' : path.extname(name),
            size: stat.size,
            created: stat.birthtime,
            modified: stat.mtime,
          };
          // console.log(indent + (info.isDirectory ? '+ ' : '  ') + info.name + ' (' + info.size + ')');
          // Si el recurs era un arxiu, sortirem desrpés de la primera volta retornant un objecte en lloc d'un array.
          if (resourceIsDirectory) { content.push(info); } else { return info; }
          // -> Crida recursiva
          if (info.isDirectory && options.recursive) { info.children = this.discover(fullName, options, indent + '  ') as ResourceType[]; }
        }
      } catch (error) {
        // console.error(error);
      }
    }
    return content;
  }

  /**
   * Copia un arxiu de manera síncrona utilitzant `fs.writeFileSync()`.
   *
   * S'utilitza conjuntament amb la funció `copyFolderSync()`.
   * @param source Carpeta d'origen de la còpia.
   * @param target Carpeta de destí de la còpia. Veure com li afecta el paràmetr d'opció `createFolderInTarget`.
   * @param indent Indica el nombre d'espais aplicats en funció de l'anidament en l'arbre d'arxius.
   * @param verbose Indica si s'imprimirà informació del procés per la consola del terminal.
   */
  static copyFileSync(source: any, target: any, options?: { indent?: string, verbose?: boolean }): void {
    if (!options) { options = {}; }
    if (options.indent === undefined) { options.indent = ''; }
    // if (options.verbose === undefined) { options.verbose = false; }
    const verbose = options.verbose === undefined ? Terminal.verboseEnabled : !!options.verbose;

    const file = path.basename( source );
    if (verbose) { console.log(options.indent + chalk.green('√'), file); }

    let targetFile = target;

    // If target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
      }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
  }

  /**
   * Copia una carpeta i el seu contingut de forma recursiva.
   *
   * S'utilitza conjuntament amb la funció `copyFileSync()`.
   * @param source Carpeta d'origen de la còpia.
   * @param target Carpeta de destí de la còpia. Veure com li afecta el paràmetr d'opció `createFolderInTarget`.
   * @param filter Indica una expressió regular o bé una funció que s'utilitzen per filtrar els elements copiats.
   * @param createFolderInTarget Indica si es crearà la carpeta al destí o bé s'hi copiarà només el seu contingut.
   * @param indent Indica el nombre d'espais aplicats en funció de l'anidament en l'arbre d'arxius.
   * @param verbose Indica si s'imprimirà informació del procés per la consola del terminal.
   */
  static copyFolderSync(source: any, target: any, options?: { filter?: string | ((resource: string) => boolean), indent?: string, createFolderInTarget?: boolean, verbose?: boolean }): number {
    if (!options) { options = {}; }
    if (options.indent === undefined) { options.indent = ''; }
    if (options.createFolderInTarget === undefined) { options.createFolderInTarget = true; }
    // if (options.verbose === undefined) { options.verbose = false; }
    // const verbose = options.verbose;
    const verbose = options.verbose === undefined ? Terminal.verboseEnabled : !!options.verbose;
    /** indent funciona como el nuevo valor (para pasarlo a los hijos) mientras que options.indent contiene el valor actual. */
    const indent = options.indent + '  ';
    const filter = options.filter;
    const files: any[] = [];

    // Check if folder needs to be created or integrated
    const targetFolder = options.createFolderInTarget ? path.join(target, path.basename(source)) : target;
    if (!fs.existsSync(targetFolder)) { fs.mkdirSync(targetFolder); }
    if (verbose && options.createFolderInTarget) { console.log(options.indent + '> ' + chalk.bold(path.basename(source))); }

    // Copy
    let copied = 0;
    if (fs.lstatSync(source).isDirectory()) {
      // Obtenim els arxius i carpetes.
      files.push(...fs.readdirSync(source));
      // 1º processem els directoris.
      files.forEach((file: any) => {
        const origin = path.join(source, file);
        if (fs.lstatSync(origin).isDirectory()) {
          if (Resource.applyFilter(origin, options.filter) && Resource.hasFiles(origin, filter)) {
            copied += Resource.copyFolderSync(origin, targetFolder, { indent, verbose, filter });
          } else {
            // if (verbose) { console.log(Terminal.orangered(options.indent + '  - ' + file)); }
          }
        }
      });
      // 2º processem els arxius.
      files.forEach((file: any) => {
        const origin = path.join(source, file);
        if (!fs.lstatSync(origin).isDirectory()) {
          if (Resource.applyFilter(origin, options.filter)) {
            Resource.copyFileSync(origin, targetFolder, { indent, verbose });
            copied++;
          } else {
            // if (verbose) { console.log(Terminal.orangered(options.indent + '  - ' + file)); }
          }
        }
      });
    }
    return copied;
  }

  /** Comprova si la carpeta conté arxius per copiar (han superat el filtre). */
  static hasFiles(folder: string, filter?: any): boolean {
    // Només directoris.
    if (fs.lstatSync(folder).isDirectory()) {
      for (const file of fs.readdirSync(folder)) {
        const origin = path.join(folder, file);
        if (fs.lstatSync(origin).isFile()) {
          if (Resource.applyFilter(origin, filter)) { return true; }
        } else {
          if (Resource.applyFilter(origin, filter) && Resource.hasFiles(origin, filter)) { return true; }
        }
      }
    }
    return false;
  }

  /**
   * Aplica un filtre al recurs indicat.
   * @param file Nom i ruta complerts del recurs que es vol filtrar.
   * @param filter Expressió o funció per aplicar com a filtre.
   */
  static applyFilter(file: string, filter: any): boolean {

    if (!filter) { return true; }

    if (typeof filter === 'string') {
      const tester = new RegExp(filter);
      return tester.test(file);

    } else if (typeof filter === 'object' && typeof filter.test === 'function') {
      return (filter as any).test(file);

    } else if (typeof filter === 'function') {
      return filter(file);

    } else {
      // throw Error('Unrecognized filter for copyFolderSync()');
      return true;
    }
  }

}

