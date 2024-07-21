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

    await api.processSchemasFromFolder(folder, { verbose, commented });

    try {
      httpServer.closeAllConnections();
    } catch (error: any) {
      Terminal.warning(error?.message || error as string);
    }
    
  } catch (error) {
    httpServer.closeAllConnections();
    Terminal.error(error);
  }
  Terminal.line();

})();
