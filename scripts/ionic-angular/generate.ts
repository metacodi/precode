#!/usr/bin/env node
import chalk from 'chalk';
/// <reference types="node" />

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
import { IonicAngularProject } from '../../src/projects/ionic-angular-project';
import { Terminal } from '../../src/utils/terminal';

Prompt
  .requiredOption('-f, --folder <folder>', 'Ruta absoluta de la carpeta i nom del component.')
  .option('-s, --singular <dir>', 'Nom singular del component.')
  .option('-v, --verbose', 'Log verbose')
  .option('-h, --ajuda', 'Ajuda')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

if (Prompt.ajuda) {
  console.clear();

  Terminal.title(' Ajuda');
  Terminal.log(Terminal.green('-f, --folder <folder>') + '  Ruta absoluta a la carpeta dins del projecte que contingui el nom de l\'entitat');
  Terminal.log(Terminal.green('-s, --singular <dir> ') + '  (opcional) Nom singular del component (només si no es pot deduir automàticament treient la `s` del final del nom).');

  Terminal.subtitle(' Exemple:');
  Terminal.log(Terminal.yellow('npx ts-node generate.ts -d C:/Users/Jordi/work/metacodi/taxi/apps/pre/logic-taxi -f src/app/acciones -s accion'));

  process.exit();
}

const bad = process.platform === 'win32' ? '/' : '\\\\';
const sep = process.platform === 'win32' ? '\\' : '/';

Prompt.folder = Prompt.folder.replace(new RegExp(bad, 'g'), sep);

// Trobem la carpeta del projecte ionic-angular.
let directory: string = Prompt.folder;
do {
  const dir = directory.split(sep);
  dir.pop();
  directory = dir.join(sep);
} while (directory && !IonicAngularProject.isProjectFolder(directory));
if (!directory) { Terminal.error(`No s'ha trobat la carpeta del projecte`); process.exit(1); }

// Creem una nova instància del projecte.
const project = new IonicAngularProject(directory);
project.initialize().then(async () => {

  const folder = Prompt.folder.split(sep);
  const plural = folder[folder.length - 1];
  const entity = { singular: Prompt.singular || plural.substring(0, plural.length - 1), plural };

  Terminal.log(chalk.bold('Entity: '), Terminal.green(JSON.stringify(entity)));
  Terminal.log('');

  await project.generateSchema(folder.join(sep), entity);
  await project.generateService(folder.join(sep), entity);
  await project.generateModule(folder.join(sep), entity);
  await project.generateListPage(folder.join(sep), entity);
  await project.generateListComponent(folder.join(sep), entity);
  await project.generateDetailPage(folder.join(sep), entity);

});
