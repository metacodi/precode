#!/usr/bin/env node
/// <reference types="node" />
import chalk from 'chalk';

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node scripts\ionic-angular\generate.ts -f C:\Users\Jordi\work\metacodi\taxi\apps\pre\logic-taxi\src\app\acciones -s accion
 * ```
 *
 * `gen.bat`
 * ```bash
 * echo off
 * cls
 * set cur=%cd%
 * cd C:\Users\Jordi\work\metacodi\tools\precode\scripts\ionic-angular\
 * if [%2]==[] (npx ts-node generate.ts -f %cur%\%1 && cd %cur%)
 * if [%2] NEQ [] (npx ts-node generate.ts -f %cur%\%1 -s %2 && cd %cur%)
 * ```
 */

import Prompt from 'commander';

import { Terminal } from '@metacodi/node-utils';

import { IonicAngularProject } from '../../src/projects/ionic-angular-project';

Prompt.program
  .requiredOption('-f, --folder <folder>', 'Ruta absoluta de la carpeta i nom del component.')
  .option('-s, --singular <singular>', 'Nom singular del component.')
  .option('-p, --plural <plural>', 'Nom plural del component. Si no s\'estableix el nom de la darrera carpeta de folder.')
  .option('-v, --verbose', 'Log verbose')
  .option('-h, --ajuda', 'Ajuda')
;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }

if (promptOpts.ajuda) {
  console.clear();

  Terminal.title(' Ajuda');
  Terminal.log(Terminal.green('-f, --folder <folder>') + '  Ruta absoluta a la carpeta dins del projecte que contingui el nom de l\'entitat');
  Terminal.log(Terminal.green('-s, --singular <singular> ') + '  (opcional) Nom singular del component (només si no es pot deduir automàticament treient la `s` del final del nom).');

  Terminal.subtitle(' Exemple:');
  Terminal.log(Terminal.yellow('npx ts-node generate.ts -d C:/Users/Jordi/work/metacodi/taxi/apps/pre/logic-taxi -f src/app/acciones -s accion'));

  process.exit();
}

const bad = process.platform === 'win32' ? '/' : '\\\\';
const sep = process.platform === 'win32' ? '\\' : '/';

promptOpts.folder = promptOpts.folder.replace(new RegExp(bad, 'g'), sep);

// Trobem la carpeta del projecte ionic-angular.
let directory: string = promptOpts.folder;
do {
  const dir = directory.split(sep);
  dir.pop();
  directory = dir.join(sep);
} while (directory && !IonicAngularProject.isProjectFolder(directory));
if (!directory) { Terminal.error(`No s'ha trobat la carpeta del projecte`); process.exit(1); }

// Creem una nova instància del projecte.
const project = new IonicAngularProject(directory);
project.initialize().then(async () => {

  const folder: string = promptOpts.folder || '';
  const plural = promptOpts.plural || folder.split(sep).pop();
  const singular = promptOpts.singular || plural.substring(0, plural.length - 1);
  const entity = { singular, plural };

  Terminal.log(chalk.bold('Entity: '), Terminal.green(JSON.stringify(entity)));
  Terminal.log('');


  await project.generateSchema(folder, entity);
  await project.generateService(folder, entity);
  await project.generateModule(folder, entity);
  await project.generateListPage(folder, entity);
  await project.generateListComponent(folder, entity);
  await project.generateDetailPage(folder, entity);

});
