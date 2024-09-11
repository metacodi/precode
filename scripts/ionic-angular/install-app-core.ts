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
import Prompt from 'commander';

import { Terminal } from '@metacodi/node-utils';

import { IonicAngularAppCore } from '../../src/deployments/ionic-angular/dependencies/ionic-angular-app-core';
import { IonicAngularProject } from '../../src/projects/ionic-angular-project';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt.program
.requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
// .requiredOption('-f, --file <file>', 'Arxiu de codi.')
.option('-t, --test', 'Només realitzar el test')
.option('-f, --file <file>', 'Arxiu de codi.')
.option('-s, --system <system>', 'Sistema operativo: windows | linux')
.option('-v, --verbose', 'Log verbose')
;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

console.clear();

Terminal.title('Install Ionic Angular App Core', { color: 'magenta' });

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }

Terminal.verboseEnabled = promptOpts.verbose || false;

// --------------------------------------------------------------------------------
//  Install Ionic Angular App Core
// --------------------------------------------------------------------------------

const project = new IonicAngularProject(promptOpts.directory || __dirname);

project.initialize().then(async () => {

  await IonicAngularAppCore.deploy(project, {
    onlyTest: promptOpts.hasOwnProperty('Test'),
    resolveOnFail: false,
    verbose: promptOpts.verbose || false
  });

  Terminal.line();

});
