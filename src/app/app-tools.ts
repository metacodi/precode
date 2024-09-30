import { FtpClient, getTableLastUpdate, Git, Resource, ResourceType, syncRow, Terminal } from "@metacodi/node-utils";
import * as mysql from 'mysql2';
import { PoolConnection, Pool } from 'mysql2/promise';
import Prompt from 'commander';
import chalk from "chalk";
import moment from "moment";

import { PrimitiveType, TypescriptParser } from "../parsers/typescript-parser";
import { AppApiClient } from "./app-api-client";



/**
 * ```typescript
 * export interface AppToolsOptions {
 *   // Path relatiu des de la carpeta d'execució (típicament /precode) fins a la carpeta on es troben els environments del projecte. Ex: `../apps`
 *   apps: string;
 *   // Nom de la propietat dins de l'arxiu 'data.ts' que conté la info del customer. @default `data`.
 *   dataIdentifier?: string;
 *   // Nom de la carpeta del projecte front-end.
 *   frontendFolder: string;
 * }
 * ```
 */
export interface AppToolsOptions {
  /** Path relatiu des de la carpeta d'execució (típicament /precode) fins a la carpeta on es troben els environments del projecte. Ex: `../apps` */
  apps: string;
  /** Nom de la propietat dins de l'arxiu 'data.ts' que conté la info del customer. @default `data`. */
  dataIdentifier?: string;
  /** Nom de la carpeta del projecte front-end.  */
  frontendFolder: string;
  /** Referència a la implementació d'un client de l'Api Rest de l'App. */
  api?: AppApiClient;
}


export class AppTools {
 
  constructor(
    public options: AppToolsOptions,
  ) {
    if (options.apps.endsWith('/')) { options.apps = options.apps.slice(1); }
  }

  get api(): AppApiClient { return this.options?.api; }

  get apps(): string { return this.options?.apps || ''; }
  
  get dataIdentifier(): string { return this.options?.dataIdentifier || 'data'; }
  
  get frontendFolder(): string { return this.options?.frontendFolder || 'frontend'; }


  // --------------------------------------------------------------------------------
  //  discover customers
  // --------------------------------------------------------------------------------

  getCustomerData(customer: string): { parser: TypescriptParser; data: PrimitiveType } {
    const { apps, dataIdentifier } = this;
    const parser = new TypescriptParser(`${apps}/customers/${customer}/data.ts`);
    const data = parser.getPropertyValue(`${dataIdentifier}`);
    return { parser, data };
  }

  getCustomerDataResolver(customer: string): { parser: TypescriptParser; resolver: (path: string) => PrimitiveType } {
    const { apps, dataIdentifier } = this;
    const parser = new TypescriptParser(`${apps}/customers/${customer}/data.ts`);
    const resolver = (path: string) => parser.getPropertyValue(path ? `${dataIdentifier}.${path}` : `${dataIdentifier}`);
    return { parser, resolver };
  }

  getCurrentCustomer(env: string): string {
    return this.findCustomerFolder(this.getCurrentAppId(env));
  }

  getCurrentAppId(env: string): string {
    const { apps, frontendFolder } = this;
    const frontend = `${apps}/${env}/${frontendFolder}`;
    const config = new TypescriptParser(`${frontend}/src/config.ts`);
    const frontendAppId = config.getPropertyValue('AppConfig.app.package') as string;
    return frontendAppId;
  }

  findCustomerFolder(appId: string): string {
    const { apps } = this;
    const folders = Resource.discover(`${apps}/customers/`) as ResourceType[];
    return folders.find(d => {
      if (!d.isDirectory) { return false; }
      const dataFile = `${apps}/customers/${d.name}/data.ts`;
      if (!Resource.exists(dataFile)) { return false; }
      const { resolver } = this.getCustomerDataResolver(d.name);
      return resolver('app.id') === appId;
    })?.name || '';
  }

  getAllCustomers(): string[] {
    const { apps } = this;
    const folders = Resource.discover(`${apps}/customers/`) as ResourceType[];
    return folders.filter(d => {
      if (!d.isDirectory) { return false; }
      const dataFile = `${apps}/customers/${d.name}/data.ts`;
      return Resource.exists(dataFile);
    }).map(value => value.name);
  }

  getCustomerVersion(customer: string, env: string): string {
    const { apps } = this;
    const backend = `${apps}/${env}/backend`;
    const { ftp, remotePath } = this.getCustomerFtpClient(customer);
    ftp.download(`${remotePath}/${env}/precode.json`, `${backend}/precode.json`);
    const precodeFile = Resource.open(`${backend}/precode.json`, { parseJsonFile: true });
    return precodeFile.version;
  };

  getCustomerFtpClient(customer: string, options?: { ftpVar?: string }): { remotePath: string, ftp: FtpClient } {
    const { apps } = this;
    if (!options) { options = {}; }
    const ftpVar = options.ftpVar === undefined ? 'ftp' : options.ftpVar;
    const { resolver } = this.getCustomerDataResolver(customer);
    const host = resolver(`${ftpVar}.host`) as string;
    const port = resolver(`${ftpVar}.port`) as number;
    const user = resolver(`${ftpVar}.username`) as string;
    const password = resolver(`${ftpVar}.password`) as string;
    const remotePath = `${resolver(`${ftpVar}.remotePath`)}`;
    const ftp = new FtpClient({ host, user, password, port });
    return { remotePath, ftp };
  }

  async getPendingChanges(env: string, side: 'backend' | 'frontend' | undefined): Promise<{ filename: string; status: string; }[]> {
    const { frontendFolder } = this;
    side = (side === 'frontend' ? frontendFolder : side) as any;
    const relativePath = side ? `apps/${env}/${side}/` : `apps/${env}/`
    const changes = (await Git.getPendingChanges()).filter(changed => changed.filename.startsWith(relativePath));
    // Convertim els noms en relatius a la carpeta.
    changes.map(changed => changed.filename.startsWith(relativePath) ? changed.filename = changed.filename.substring(relativePath.length) : changed.filename);
    return changes;
  }


  // --------------------------------------------------------------------------------
  //  customer database connection
  // --------------------------------------------------------------------------------

  /** Manté un pool de connexions per cada environment de cada customer. */
  pools: { [customer_env: string]: mysql.Pool } = {};

  /** Obté una connexió del pool del customer i l'environment per fer lots de consultes.
   * 
   * En acabat, cal alliberar la connexió fent `release()`.
   *
   * ```typescript
   * const conn: PoolConnection = await getPersistentConnection(customer, env);
   * const [ rows ] = conn.query(`SELECT * FROM table`);
   * conn.release();
   * ```
   */
  async getPersistentConnection(customer: string, env: string): Promise<PoolConnection> {
    const pool = await this.getConnection(customer, env);
    // @ts-ignore
    if (!pool) { return undefined; }
    const conn: PoolConnection = await pool.getConnection();
    return conn;
  }

  /** Obté un pool del customer i l'environment per fer consultes puntuals.
   * 
   * Després d'executar la consulta no cal tancar-la.
   *
   * ```typescript
   * const conn: Pool = await getConnection(customer, env);
   * const [ rows ] = conn.query(`SELECT * FROM table`);
   * ```
   */
  getConnection(customer: string, env: string): Promise<Pool> {
    return new Promise<Pool>((resolve: any, reject: any) => {
      const poolKey = `${customer}-${env}`;
      if (!this.pools[poolKey]) {

        const { parser, resolver } = this.getCustomerDataResolver(customer);
        if (!parser.existsPropertyPath(`database.${env}.hostname`)) { resolve(undefined); return; }
        
        const config: mysql.PoolOptions = {
          connectionLimit: 10,
          host: resolver(`database.${env}.hostname`) as string,
          user: resolver(`database.${env}.username`) as string,
          password: resolver(`database.${env}.password`) as string,
          database: resolver(`database.${env}.database`) as string,
        }

        this.pools[poolKey] = mysql.createPool(config);
      }
      resolve(this.pools[poolKey].promise());
    });
  }

  /** Tanca totes les connexions de tots els pools i els allibera de memòria. */
  closeConnections() {
    Object.keys(this.pools).map(key => { try { this.pools[key].end(); } catch(ex) { /* ignore error */ } });
  }


  /** Executa les sentències per a tots els customers indicats.
   *
   * @param options.customers Si no s'indica cap, s'obtenen a través de `getAllCustomers()`.
   */
  async executeQueries(queries: string[], env: string, options?: { customers?: string[]; verbose?: boolean; }) {
    if (!options) { options = {}; }
    const promptOptions = Prompt.program.opts();
    const customers = options.customers === undefined ? this.getAllCustomers() : options.customers;
    const verbose = options.verbose === undefined ? promptOptions.verbose : options.verbose;
    for (const customer of customers) {
      const conn = await this.getPersistentConnection(customer, env);
      if (conn) {
        if (verbose) { Terminal.log(`Connected to ${chalk.bold(`${customer}`)} db`); }
        for (const query of queries) {
          if (verbose) { Terminal.log(chalk.blueBright(query)); }
          await conn.query(query);
        }
        this.closeConnections();

      } else {
        if (verbose) { Terminal.warning(`No existeix l'entorn ${chalk.green(`${env}`)} per ${chalk.bold(`${customer}`)}`); }
      }
    }
  }

  /** Actualitza els canvis d'auditoria de la taula indicada (comprovant el camp `updated`) d'un entorn a un altre.
   *
   * @param fromCustomer Si no s'indica cap, s'utilitza per defecte `'demo'`.
   * @param toCustomers Si no s'indica cap, s'obtenen a través de `getAllCustomers()`.
   */
  async syncTableChanges(table: string, fromEnv: string, toEnv: string, fromCustomer?: string, toCustomers?: string[]): Promise<void> {
    const promptOptions = Prompt.program.opts();
    // Per defecte de `demo` a tots els altres customers.
    fromCustomer = fromCustomer || 'demo';
    toCustomers = toCustomers || this.getAllCustomers();
    if (!Array.isArray(toCustomers)) { toCustomers = [toCustomers]; }
    // Comprovem els darrers canvis segons el camp d'auditoria `updated` de la taula.
    const fromUpdated = await this.getCustomerTableLastUpdate('demo', fromEnv, table);
    const toUpdated = await this.getCustomerTableLastUpdate('demo', toEnv, table);
    if (promptOptions.verbose) { Terminal.log('changes:', { fromUpdated, toUpdated }); }
    if (!toUpdated || fromUpdated > toUpdated) {
      // Obtenim totes les files amb canvis que s'han d'actualitzar.
      const fromConn = await this.getConnection('demo', fromEnv);
      const sql = toUpdated ? `SELECT * FROM ${table} WHERE updated > '${toUpdated}'` : `SELECT * FROM ${table}`;
      const [ rows ] = await fromConn.query(sql);
      Terminal.log(`Tenim ${chalk.green((rows as any[]).length)} canvis a ${chalk.yellow(table)} des de ${chalk.green(toUpdated)}`);
      // Actualitzem els canvis a cada customer.
      for (const customer of toCustomers) {
        const conn = await this.getPersistentConnection(customer, toEnv);
        for (const row of (rows as any[])) { 
          await syncRow(conn, table, row);
        }
        conn.release();
        Terminal.log(`Actualitzat ${chalk.yellow(customer)} ${chalk.green(toEnv)} ${table}`);
      }

    } else {
      Terminal.log(`No hi ha canvis a ${chalk.yellow(table)}`);
    }
    return Promise.resolve();
  }

  /** Obté la data d'auditoria (camp `updated`) de l'actualització més recent. */
  async getCustomerTableLastUpdate(customer: string, env: string, table: string): Promise<string> {
    const conn = await this.getConnection(customer, env);
    const date = await getTableLastUpdate(conn, table);
    if (!date || date === 'Invalid date' || !moment(date).isValid()) {
      const [rows] = await conn.query(`SELECT updated FROM ${table} ORDER BY updated DESC LIMIT 1`);
      const result = Array.isArray(rows) ? rows as any[] : [rows];
      return Promise.resolve(result.length ? moment(result[0].updated).format('YYYY-MM-DD HH:mm:ss') : '');
    } else {
      return date;
    }
  }

}