#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node scripts/php/test-php.ts -v
 *  npx ts-node scripts/php/test-php.ts -d C:\Users\Jordi\work\metacodi\taxi\apps\pre\backend\api
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';
import * as fs from 'fs';
import php, { Program, Node } from 'php-parser';

import { Terminal } from '../../src/utils/terminal';

import { PhpParser } from '../../src/parsers/php-parser';
import { PhpProject } from '../../src/projects/php-project';
import { XmlParser } from '../../src/parsers/xml-parser';
import { I18n } from '../../src/deployments/angular/i18n';


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

Terminal.title('Test PHP', { color: 'magenta' });

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }


// --------------------------------------------------------------------------------
//  PhpProject
// --------------------------------------------------------------------------------

const project = new PhpProject(Prompt.directory || __dirname);

project.initialize().then(async () => {

  // const program = project.getSourceFile(project.rootPath('api.php'));
  // const classe = project.findClassDeclaration('api', program);

  const program = PhpParser.parse(project.rootPath('api.php'));
  // console.log('program =', (program as any));
  const classe = project.findClassDeclaration('api', program);
  if (classe !== undefined) { console.log('classe =', (classe as any).name.name); }

  Terminal.line();
});
