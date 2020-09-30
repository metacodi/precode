#!/usr/bin/env node
/// <reference types="node" />

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node scripts\ionic-angular\generate.ts -d C:\Users\Jordi\work\metacodi\taxi\apps\pre\logic-taxi -f src\app\acciones -s accion
 * ```
 */

import Prompt from 'commander';
import { IonicAngularProject } from '../../src/projects/ionic-angular-project';
import { Terminal } from '../../src/utils/terminal';

Prompt
  .requiredOption('-f, --folder <folder>', 'Carpeta i nom del component.')
  .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-s, --singular <dir>', 'Nom singular del component.')
  .option('-v, --verbose', 'Log verbose')
  .option('-h, --ajuda', 'Ajuda')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

if (Prompt.ajuda) {
  console.clear();

  Terminal.title(' Ajuda');
  Terminal.log(Terminal.green('-d, --directory <dir>') + '  Ruta absoluta del projecte.');
  Terminal.log(Terminal.green('-f, --folder <folder>') + '  Ruta relativa a la carpeta del projecte que contingui el nom de l\'entitat');
  Terminal.log(Terminal.green('-s, --singular <dir> ') + '  (opcional) Nom singular del component (només si no es pot deduir automàticament treient la `s` del final del nom).');

  Terminal.subtitle(' Exemple:');
  Terminal.log(Terminal.yellow('npx ts-node generate.ts -d C:\\Users\\Jordi\\work\\metacodi\\taxi\\apps\\pre\\logic-taxi -f src\\app\\acciones -s accion'));
  process.exit(1);
}

const project = new IonicAngularProject(Prompt.directory);
project.initialize().then(async () => {

  const folder = Prompt.folder.split('\\');
  const plural = folder[folder.length - 1];
  const entity = { singular: Prompt.singular || plural.substring(0, plural.length - 1), plural };

  await project.generateSchema(folder.join('\\'), entity);
  await project.generateService(folder.join('\\'), entity);
  await project.generateModule(folder.join('\\'), entity);
  await project.generateListPage(folder.join('\\'), entity);
  await project.generateListComponent(folder.join('\\'), entity);
  await project.generateDetailPage(folder.join('\\'), entity);

});
