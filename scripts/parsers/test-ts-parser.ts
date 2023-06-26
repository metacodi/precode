#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node scripts/parsers/test-ts-parser.ts -d scripts/parsers/sample-code.ts
 *
 * -------------------------------------------------------------------------------- */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

import { Terminal } from '@metacodi/node-utils';

// import { PhpProject } from '../../src/projects/php-project';
import { XmlParser } from '../../src/parsers/xml-parser';
// import { PhpParser } from '../../src/parsers/php-parser';
import { CodeProject } from '../../src/';
import { TypescriptParser } from '../../src/parsers/typescript-parser';


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

Terminal.title('Test Parsers', { color: 'magenta' });

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }


// --------------------------------------------------------------------------------
//  Test Parsers
// --------------------------------------------------------------------------------

const capacitorConfigElectronPath = Prompt.directory;
const parser = new TypescriptParser(capacitorConfigElectronPath);
// const propertyKeyboard = parser.resolvePropertyPath('config.plugins.Keyboard');
// const propertyIos = parser.resolvePropertyPath('config.ios');
// parser.replacements.push({ start: propertyKeyboard.pos + 1, end: propertyKeyboard.end, text: '' });
// parser.replacements.push({ start: propertyIos.pos + 1, end: propertyIos.end, text: '' });
parser.removeProperty('config.appId');
parser.removeProperty('config.plugins.Keyboard');
parser.removeProperty('config.ios');
parser.save();

