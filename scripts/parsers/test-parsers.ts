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
import * as fs from 'fs';
import php, { Program, Node } from 'php-parser';

import { Terminal } from '../../src/utils/terminal';

import { PhpProject } from '../../src/projects/php-project';
import { XmlParser } from '../../src/parsers/xml-parser';
import { PhpParser } from '../../src/parsers/php-parser';
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

Terminal.title('Test Parsers', 'magenta');

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }


// --------------------------------------------------------------------------------
//  Test Parsers
// --------------------------------------------------------------------------------

const project = new PhpProject(Prompt.directory);

project.initialize().then(async () => {


  // --------------------------------------------------------------------------------
  //  PHP Parser
  // --------------------------------------------------------------------------------

  Terminal.title('PHP Parser');

  // // const program = project.getSourceFile(project.rootPath('api.php'));
  const program = PhpParser.parse(project.rootPath('api.php'));
  // console.log('program =', (program as any));
  const classe = project.findClassDeclaration('api', program);
  if (classe !== undefined) { console.log('classe =', (classe as any).name.name); }


  // --------------------------------------------------------------------------------
  //  Xml Parser
  // --------------------------------------------------------------------------------

  Terminal.title('Xml Parser');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <note>
    <from>Un</from>
    <address>
      <street>
        <number>12</number>
        <name>Meirmad avenue</name>
      </street>
    </address>
    <to>Bill</to>
  </note>`;

  const doc = XmlParser.parse(undefined, xml);
  const tag = XmlParser.find(doc, ((n: any) => n.name === 'address'), { recursive: true });
  console.log('result =', tag.name);


  Terminal.line();
});
