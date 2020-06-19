#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node src/scripts/ionic-angular/test-deployments.ts -v
 *  npx ts-node src/scripts/ionic-angular/test-deployments.ts -d C:\Users\Jordi\work\metacodi\tools\test-project\frontend -v
 *  npx ts-node src/scripts/ionic-angular/test-deployments.ts -f src/app/app.module.ts -v
 *
 * -------------------------------------------------------------------------------- */


import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

import * as fs from 'fs';
import * as ts from 'typescript';
import { i18n } from '../../src/deployments/ionic-angular/i18n';
import * as mysql from 'mysql';
import { Terminal } from '../../src/utils/terminal';
import { TypescriptProject } from '../../src/typescript-project';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt
.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
// .requiredOption('-f, --file <file>', 'Arxiu de codi.')
  // .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

console.clear();

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }


// --------------------------------------------------------------------------------
//  Test Deployments
// --------------------------------------------------------------------------------

const project: TypescriptProject = new TypescriptProject(Prompt.directory || __dirname);

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

  const Di18n = new i18n(project);
  // Di18n.deploy();
  Di18n.test();

  // project.install([Di18n]).then(() => {
  //   console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n`);
  //   Terminal.line();
  // });

});
