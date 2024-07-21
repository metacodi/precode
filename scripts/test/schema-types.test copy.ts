#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';

import express from 'express';
import { createServer } from 'http';

import { Resource, ResourceType, Terminal } from '@metacodi/node-utils';

import { AppApiClient } from '../../src/customers/app-api-client';


const app = express();
const httpServer = createServer(app);

const api = new AppApiClient({
  httpServer: httpServer,
  apiBaseUrl: 'https://scrownet.metacodi.com/dev/api',
  apiIdUser: 9,
});


/** Genera els tipus de les entitats declarades als arxius d'esquema i els deixa en un arxiu amb el mateix nom acabat en `.types.ts`
 *
 * ```
 * npx ts-node scripts/test/schema-types.test.ts -f "scripts/test/" -c
 * ```
 */

/** {@link https://www.npmjs.com/package/commander#common-option-types-boolean-and-value } */
Prompt.program
  .option('-f, --folder <folder>', `Indica la carpeta on es cercaran els esquemes. Per defecte "src/app"`)
  .option('-c, --commented', `Indica si les interfaces es generaran auto-comentades.`)
  .option('-v, --verbose', 'Log verbose')
;
Prompt.program.parse(process.argv);

const options = Prompt.program.opts();

if (options.verbose) { console.log('Arguments: ', options); }

const relativeProjectPath = Resource.normalize('./');

(async () => {
  try {
   
    const folder = Resource.concat(relativeProjectPath, options.folder || Resource.normalize('src/app'));
    const verbose = !!options.verbose;
    const commented = !!options.commented;
    const schemaErrors: { file: ResourceType; interfaceName: string; message: any; }[] = [];

    Terminal.title(chalk.bold(`Create entities types`));
    Terminal.logInline('- Scanning folder...');

    // Obtenim els esquemes de la carpeta indicada.
    const resources = Resource.discover(folder, { recursive: true }) as ResourceType[];

    // Reduim l'arbre de resultats a un array.
    const reduce = (res: ResourceType[]): ResourceType[] => res.reduce((files, f) =>
      [...files, ...(/\.schema\.ts$/.test(f.fullName) ? [f] : []), ...reduce(f.children || [])]
    , [] as ResourceType[]);
    const files = reduce(resources);

    Terminal.success(`Found ${chalk.bold(files.length)} schema file(s).`);

    for (const file of files) {

      const { errors } = await api.processSchemaFile(file, { folderRelativeTo: folder, verbose, commented })

      schemaErrors.push(...errors);
    }

    try {
      httpServer.closeAllConnections();
    } catch (error: any) {
      Terminal.warning(error?.message || error as string);
    }

    if (schemaErrors.length) {
      Terminal.line();
      Terminal.log(chalk.bold.red(`\nERRORS RESUME:\n`));
      schemaErrors.map(error => {
        const { file, interfaceName, message } = error;
        Terminal.log(`${chalk.red(`x`)} ${file.fullName.substring(folder.length)}`);
        Terminal.log(`  ${chalk.bold.red(interfaceName)}: ${chalk.red(message)}\n`);
      });
    }
    
  } catch (error) {
    httpServer.closeAllConnections();
    Terminal.error(error);
  }
  Terminal.line();

})();
