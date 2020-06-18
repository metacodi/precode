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
import { i18n } from '../../code/modules/i18n';
import * as mysql from 'mysql';
import { TypescriptProject } from '../../code/typescript-project';

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
//  Code Project
// --------------------------------------------------------------------------------

const project: TypescriptProject = new TypescriptProject(Prompt.directory || __dirname);

project.initialize().then(async () => {


  // const info = project.discover(path.join('tsconfig.json'));
  console.log(project.line);
  // const info = project.discover(Prompt.directory, { recursive: true, ignore: 'node_modules|.git' });
  console.log(JSON.stringify(project.config, null, '  '));
  console.log(project.line);
  console.log(JSON.stringify(project.package, null, '  '));
  console.log(project.line);
  // console.log(JSON.stringify(info, null, '  '));
  // console.log(project.discoverFolder(Prompt.directory));
  // console.log(TypescriptProject.discoverProjects(Prompt.directory));

});
