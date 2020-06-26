#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node scripts\ionic-angular\install-app-core.ts -v
 *  npx ts-node scripts\ionic-angular\install-app-core.ts -d C:\Users\Jordi\work\metacodi\taxi\apps\pre\frontend -v
 *  npx ts-node scripts\ionic-angular\install-app-core.ts -d C:\Users\Jordi\work\metacodi\tools\test-project\frontend -v
 *  npx ts-node scripts\ionic-angular\install-app-core.ts -f src/app/app.module.ts -v
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk';
import path from 'path';
import Prompt from 'commander';
import * as fs from 'fs';
import * as ts from 'typescript';

import { Terminal } from '../../src/utils/terminal';

import { IonicAngularAppCore } from '../../src/deployments/ionic-angular/dependencies/ionic-angular-app-core';
import { IonicAngularProject } from '../../src/projects/ionic-angular-project';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt
.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
// .requiredOption('-f, --file <file>', 'Arxiu de codi.')
  // .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-t, --test', 'Només realitzar el test')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

console.clear();

Terminal.title('Install Ionic Angular App Core', 'magenta');

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }

Terminal.verboseEnabled = Prompt.verbose || false;

// --------------------------------------------------------------------------------
//  Install Ionic Angular App Core
// --------------------------------------------------------------------------------

const project = new IonicAngularProject(Prompt.directory || __dirname);

project.initialize().then(async () => {

  await IonicAngularAppCore.deploy(project, {
    onlyTest: Prompt.hasOwnProperty('Test'),
    resolveOnFail: false,
    verbose: Prompt.verbose || false
  });

  Terminal.line();

});
