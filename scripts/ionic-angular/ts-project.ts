#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node src/scripts/ionic-angular/ts-project.ts -d C:\Users\Jordi\work\metacodi\tools\meta-model
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

import { Terminal } from '@metacodi/node-utils';

import { TypescriptProject } from '../../src/projects/typescript-project';
import { I18n } from '../../src/deployments/angular/i18n';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt.program
.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
// .requiredOption('-f, --file <file>', 'Arxiu de codi.')
  // .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }


// --------------------------------------------------------------------------------
//  Test Project
// --------------------------------------------------------------------------------

Terminal.title('TESTING TYPESCRIPT PROJECT', { color: 'blue' });

const project: TypescriptProject = new TypescriptProject(promptOpts.directory || __dirname);

project.initialize().then(async () => {

  // await project.install(['npm i --save @ngx-translate/core']);

  // project.install([i18n]);
  const Di18n = new I18n(project);
  Terminal.title(Di18n.title, { color: 'blue' });
  // Di18n.deploy(project, { resolveOnFail: false, verbose: true });

  //   Terminal.line();
  //   // console.log(path.join(promptOpts.directory, 'tsconfig.json'));
  //   // Terminal.line();
  //   // const info = Resource.discover(path.join(promptOpts.directory, 'tsconfig.json'));
  //   // Terminal.line();
  //   console.log(chalk.bold(promptOpts.directory));
  //   const info = Resource.discover(promptOpts.directory, { recursive: true, ignore: 'node_modules|\.git|out' });
  //   // console.log(JSON.stringify(project.config, null, '  '));
  //   // console.log(JSON.stringify(info, null, '  '));
  //   // console.log(project.discoverFolder(promptOpts.directory));
  //   // console.log(TypescriptProject.discoverProjects(promptOpts.directory));

  // Terminal.line();
  Terminal.line({ color: 'cyan' });

});
