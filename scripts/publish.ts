#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';
import Client from 'ftp';
import * as fs from 'fs';

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node precode\publish.ts
 * ```
 */

import { TypescriptProject, Terminal, Resource, Git } from '../src/';

Terminal.title('PUBLISH');

Prompt
  // .requiredOption('-f, --folder <folder>', 'Ruta absoluta de la carpeta i nom del component.')
  // .option('-c, --commit <dir>', 'Descripció pel commit')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

Prompt.folder = Resource.normalize(Prompt.folder || process.cwd());

const project: TypescriptProject = new TypescriptProject();
project.initialize().then(async () => {

  project.incrementPackageVersion();

  if (Resource.exists(`dist`)) {
    Terminal.log(`Eliminant la carpeta de distribució ${chalk.bold(`dist`)}.`);
    Resource.removeSync(`dist`);
  }

  Terminal.log(chalk.bold(`Compilant projecte typescript`));
  await Terminal.run(`tsc`);

  // const ok = await Git.publish({ branch: 'main', commit: Prompt.commit });
  // if (ok) { Terminal.log(`Git published successfully!`); }

  Terminal.log(`npm publish`);
  await Terminal.run(`npm publish`);

  Terminal.log(chalk.blueBright(`Repositori publicat correctament!`));
  const pkg = Resource.open('package.json');
  Terminal.log(chalk.green(`npm install ` + chalk.bold(`@metacodi/precode@${pkg.version}`) + ' --save-dev'));

  Terminal.line();
});
