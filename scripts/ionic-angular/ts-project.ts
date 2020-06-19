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
import { i18n } from '../../src/deployments/ionic-angular/i18n';
import * as mysql from 'mysql';
import { TypescriptProject } from '../../src/typescript-project';
import { Terminal } from '../../src/utils/terminal';
import { Resource } from '../../src/utils/resource';


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

Terminal.title('TESTING TYPESCRIPT PROJECT', 'cyan');

const project: TypescriptProject = new TypescriptProject(Prompt.directory || __dirname);

project.initialize().then(async () => {

  // await project.install(['npm i --save @ngx-translate/core']);

  // project.install([i18n]);
  const Di18n = new i18n(project);
  Terminal.title(Di18n.title, 'blue');
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

  // Terminal.line();
  Terminal.line('cyan');

});
