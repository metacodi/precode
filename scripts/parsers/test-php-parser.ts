#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node scripts/parsers/test-parsers.ts -v
 *  npx ts-node scripts/parsers/test-parsers.ts -d C:\Users\Jordi\work\metacodi\taxi\apps\pre\backend\api
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

import { Terminal } from '@metacodi/node-utils';

import { PhpProject } from '../../src/projects/php-project';
import { XmlParser } from '../../src/parsers/xml-parser';
import { PhpParser } from '../../src/parsers/php-parser';
import { CodeProject, TypescriptProject } from '../../src';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt.program
  .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();
  
console.clear();

Terminal.title('PHP Parser', { color: 'magenta' });

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }


// --------------------------------------------------------------------------------
//  Test Parsers
// --------------------------------------------------------------------------------

const project = new PhpProject(promptOpts.directory || __dirname);

(async () => {

  const program = PhpParser.parse(project.rootPath('api.php'));
  // console.log('program =', (program as any));
  const classe = PhpParser.findClassDeclaration('api', program);
  if (classe !== undefined) { console.log('classe =', (classe as any).name.name); }

  Terminal.line();

})();
