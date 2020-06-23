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

Terminal.title('Test PHP', 'magenta');

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }


// --------------------------------------------------------------------------------
//  Test Deployments
// --------------------------------------------------------------------------------

const project = new PhpProject(Prompt.directory || __dirname);

project.initialize().then(async () => {

  // const program = project.getSourceFile(project.rootPath('api.php'));
  // const classe = project.findClassDeclaration('api', program);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<note>
  <from>Un</from>
  <move>
    <in>
      <deepth>
        deppest
      </deepth>
    </in>
  </move>
  <to>Bill</to>
  <from>Tim</from>
</note>`;

  const tree = XmlParser.parse(undefined, xml);
  // console.log('root element = ', tree.rootElement.position);

  const result = XmlParser.find(tree, ((n: any) => {
    if (n.name === 'note') { return n; }
  }), { recursive: true });
  console.log('result =', result.name);


  Terminal.line();
});
