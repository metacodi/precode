import { FtpClient, getTableLastUpdate, Git, Resource, ResourceType, syncRow, Terminal } from "@metacodi/node-utils";
import * as mysql from 'mysql2';
import { PoolConnection, Pool } from 'mysql2/promise';
import Prompt from 'commander';
import chalk from "chalk";
import moment from 'moment';

import { PrimitiveType, TypescriptParser } from "../parsers/typescript-parser";

import { AppCustomersOptions } from "./app-customers.types";


const promptOptions = Prompt.program.opts();

export class AppCustomers {
 
  constructor(
    public options: AppCustomersOptions,
  ) {
    if (options.apps.endsWith('/')) { options.apps = options.apps.slice(1); }
  }

  get apps(): string { return this.options?.apps || ''; }
  
  get dataIdentifier(): string { return this.options?.dataIdentifier || 'data'; }
  
  get frontendFolder(): string { return this.options?.frontendFolder || ''; }


  // --------------------------------------------------------------------------------
  //  discover customers
  // --------------------------------------------------------------------------------

  getCustomerData(customer: string): { parser: TypescriptParser; data: (path: string) => PrimitiveType } {
    const { apps, dataIdentifier } = this;
    const parser = new TypescriptParser(`${apps}/customers/${customer}/data.ts`);
    const data = (path: string) => parser.getPropertyValue(`${dataIdentifier}.${path}`);
    return { parser, data };
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
      const { data } = this.getCustomerData(d.name);
      return data('app.id') === appId;
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
    const { data } = this.getCustomerData(customer);
    const host = data(`${ftpVar}.host`) as string;
    const port = data(`${ftpVar}.port`) as number;
    const user = data(`${ftpVar}.username`) as string;
    const password = data(`${ftpVar}.password`) as string;
    const remotePath = `${data(`${ftpVar}.remotePath`)}`;
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
   * const conn: PoolConnection = await getPersistentConnecion(customer, env);
   * const [ rows ] = conn.query(`SELECT * FROM table`);
   * conn.release();
   * ```
   */
  async getPersistentConnecion(customer: string, env: string): Promise<PoolConnection> {
    const pool = await this.getConnecion(customer, env);
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
   * const conn: Pool = await getConnecion(customer, env);
   * const [ rows ] = conn.query(`SELECT * FROM table`);
   * ```
   */
  getConnecion(customer: string, env: string): Promise<Pool> {
    return new Promise<Pool>((resolve: any, reject: any) => {
      const poolKey = `${customer}-${env}`;
      if (!this.pools[poolKey]) {

        const { parser, data } = this.getCustomerData(customer);
        if (!parser.existsPropertyPath(`database.${env}.hostname`)) { resolve(undefined); return; }
        
        const config: mysql.PoolOptions = {
          connectionLimit: 10,
          host: data(`database.${env}.hostname`) as string,
          user: data(`database.${env}.username`) as string,
          password: data(`database.${env}.password`) as string,
          database: data(`database.${env}.database`) as string,
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
    const customers = options.customers === undefined ? this.getAllCustomers() : options.customers;
    const verbose = options.verbose === undefined ? promptOptions.verbose : options.verbose;
    for (const customer of customers) {
      const conn = await this.getPersistentConnecion(customer, env);
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

}