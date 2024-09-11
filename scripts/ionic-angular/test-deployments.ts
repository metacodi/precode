#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node scripts/ionic-angular/test-deployments.ts -v
 *  npx ts-node scripts/ionic-angular/test-deployments.ts -d C:\Users\Jordi\work\metacodi\taxi\apps\pre\frontend -v
 *  npx ts-node scripts/ionic-angular/test-deployments.ts -d C:\Users\Jordi\work\metacodi\tools\test-project\frontend -v
 *  npx ts-node scripts/ionic-angular/test-deployments.ts -f src/app/app.module.ts -v
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

import { Terminal } from '@metacodi/node-utils';

import { AngularProject } from '../../src/projects/angular-project';
import { I18n } from '../../src/deployments/angular/i18n';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt.program
.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }
  
console.clear();

Terminal.title('Test Deployments', { color: 'magenta' });


// --------------------------------------------------------------------------------
//  Test Deployments
// --------------------------------------------------------------------------------

const project = new AngularProject(promptOpts.directory || __dirname);

project.initialize().then(async () => {

  // await project.connect({
  //   connectionLimit : 10,
  //   host: 'mysql-5703.dinaserver.com',
  //   user: 'pre_user_db',
  //   password: 'JCW4xe8xa5d7f',
  //   database: 'pre_excel_db'
  // });

  // const results = await project.query('SELECT idreg, name FROM `roles`');

  // console.log('results => ', JSON.stringify(results, null, '  '));

  // await project.closeConnection();

  // i18n.deploy(project).then(() => {
  //   console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n`);
  //   Terminal.line();
  // });

  const options = { onlyTest: true, resolveOnFail: false, verbose: promptOpts.verbose || false };
  const i18n = new I18n();
  Terminal.title(`Test ${i18n.title}`);
  await i18n.deploy(project, options);

  // project.install([i18n]).then(() => {
  //   console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n`);
  //   Terminal.line();
  // });

  Terminal.line();

});
