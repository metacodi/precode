#!/usr/bin/env node
/// <reference types="node" />

import Prompt from 'commander';
import { IonicAngularProject } from '../../../projects/ionic-angular-project';

Prompt
  .requiredOption('-f, --folder <folder>', 'Carpeta i nom del component.')
  .option('-s, --singular <dir>', 'Nom singular del component.')
  .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

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
