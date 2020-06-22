import * as fs from 'fs';
import * as path from 'path';
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
    const concat: string = folder.endsWith('/') || folder.endsWith('\\') ? '' : '/';
    const file = fileName.startsWith('/') || fileName.startsWith('\\') ? fileName.substr(1) : fileName;
    return Resource.normalize(folder + concat + file);
  }

  /** Substitueix totes les barres per contra-barres.
   * @category Path
   */
  static normalize(fileName: string, concat = '\\') {
    return fileName.replace(new RegExp('/', 'g'), concat);
  }

  /**
   * Llegeix el contingut d'un arxiu i intenta parsejar-lo comrpovant l'extensió.
   *
   * Per exemple, si l'arxiu és un de tipus `json` aleshores es retorna el resultat de
   * `JSON.parse(content)`
   */
  static open(fileName: string): any {
    try {
      // Obtenim el contingut de l'arxiu.
      const content = fs.readFileSync(fileName).toString();

      // Parsejem el contingut.
      const file = Resource.discover(fileName) as ResourceType;
      if (file.extension === '.json') {
        return JSON.parse(content);
      }

      return content;

    } catch (err) {
      Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
      return undefined;
    }
  }

  static save(fileName: string, content: string | object, options?: fs.WriteFileOptions): boolean {
    try {
      if (!options) { options = {}; }

      // Parsejem el contingut.
      const file = Resource.discover(fileName) as ResourceType;
      if (file.extension === '.json' && typeof content === 'object') {
        content = JSON.stringify(content);
      }

      fs.writeFileSync(fileName, content, options);
      return true;

    } catch (err) {
      Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
      return false;
    }
  }

  // /** Obre un arxiu JSON i el decodifica. */
  // static open(fileName: string): any {
  //   try {
  //     return JSON.parse(fs.readFileSync(fileName).toString());

  //   } catch (err) {
  //     // Terminal.error(`Error parsejant l'arxiu JSON '${Terminal.file(fileName)}'.`, false);
  //     return undefined;
  //   }
  // }

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
   *   "path": "C:\\Users\\Jordi\\work\\metacodi\\tools\\meta-model",
   *   "fullName": "C:\\Users\\Jordi\\work\\metacodi\\tools\\meta-model\\tsconfig.json",
   *   "isDirectory": false,
   *   "isFile": true,
   *   "extension": ".json",
   *   "size": 1035,
   *   "created": "2020-06-15T13:37:16.891Z",
   *   "modified": "2020-06-18T10:59:27.228Z"
   * }
   *
   * @param resource Ruta absoluta del recurs que es vol explorar.
   * @param extra Indica si s'obtindrà informació més detallada dels recursos a través d'una crida a `fs.statSync`.
   * @param ignore Expressió regular per escloure arxius i carpetes.
   * @param recursive Realitza crides recursives per descobrir els recursos de dins les carpetes.
   */
  static discover(resource: string, options?: { ignore?: string | RegExp, recursive?: boolean }, indent = ''): ResourceType | ResourceType[] {
    if (!options) { options = {}; }
    if (options.ignore === undefined) { options.ignore = 'node_modules|\.git'; }
    if (options.recursive === undefined) { options.recursive = false; }
    if (typeof options.ignore === 'string') { options.ignore = new RegExp(options.ignore); }

    if (!fs.existsSync(resource) || !Resource.isAccessible(resource)) { Terminal.error(`No existeix el recurs '${Terminal.file(resource)}'`); return []; }

    const content: ResourceType[] = [];
    const resourceIsDirectory = fs.lstatSync(resource).isDirectory();
    const resources: string[] = resourceIsDirectory ? fs.readdirSync(resource) : [ path.basename(resource) ];
    resource = resourceIsDirectory ? resource : path.dirname(resource);

    for (const name of Object.values(resources)) {

      const fullName = path.join(resource, name);
      const stat: fs.Stats = fs.statSync(fullName);

      if (Resource.isAccessible(fullName) && (!options.ignore || !options.ignore.test(name))) {
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
        // Si el recurs era un arxiu, sortiem desrpés de la primera voltra retornant un objecte en lloc d'un array.
        if (resourceIsDirectory) { content.push(info); } else { return info; }
        // -> Crida recursiva
        if (info.isDirectory && options.recursive) { info.children = this.discover(fullName, options, indent + '  ') as ResourceType[]; }
      }
    }
    return content;
  }

}
