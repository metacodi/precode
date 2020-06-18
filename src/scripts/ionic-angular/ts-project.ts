#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node src/scripts/ionic-angular/ts-project.ts -d C:\Users\Jordi\work\metacodi\tools\meta-model
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as path from 'path';
import { CodeProject, TextReplacer } from '../../code';
import { i18n } from '../../code/deployments/ionic-angular/i18n';
import * as mysql from 'mysql';
import { TypescriptProject } from '../../code/typescript-project';
import { Terminal } from '../../utils/terminal';
import { Resource } from '../../utils/resource';


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
//  Test Project
// --------------------------------------------------------------------------------

Terminal.line();

const project: TypescriptProject = new TypescriptProject(Prompt.directory || __dirname);

project.initialize().then(async () => {

  // Terminal.log(`${chalk.green(chalk.bold('√'))} No s'ha trobat instal·lada la dependència '${chalk.bold('@ngx-translate/core')}'.`);
  // Terminal.log(`${chalk.red(chalk.bold('x'))} No s'ha trobat instal·lada la dependència '${chalk.bold('@ngx-translate/core')}'.`);

  // await project.install(['npm i --save @ngx-translate/core']);
  // Terminal.line();

  // Terminal.title('hola');
  const Di18n = new i18n(project);
  // Di18n.deploy();
  Di18n.test(project, { resolveOnFail: false, verbose: true });
//   Terminal.line();
//   // console.log(path.join(Prompt.directory, 'tsconfig.json'));
//   // Terminal.line();
//   // const info = Resource.discover(path.join(Prompt.directory, 'tsconfig.json'));
//   // Terminal.line();
//   console.log(chalk.bold(Prompt.directory));
//   const info = Resource.discover(Prompt.directory, { recursive: true, ignore: 'node_modules|\.git|out' });
//   // console.log(JSON.stringify(project.config, null, '  '));
//   // console.log(JSON.stringify(info, null, '  '));
//   // console.log(project.discoverFolder(Prompt.directory));
//   // console.log(TypescriptProject.discoverProjects(Prompt.directory));

//   Terminal.line();
});
