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

import { CodeProject } from '../../src';
import { XmlParser } from '../../src/parsers/xml-parser';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt.program
  .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  // .requiredOption('-f, --file <file>', 'Arxiu de codi.')
  // .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();
  
console.clear();

Terminal.title('Test Parsers', { color: 'magenta' });

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }


// --------------------------------------------------------------------------------
//  Test Parsers
// --------------------------------------------------------------------------------

const project = new CodeProject(promptOpts.directory);

project.initialize().then(async () => {

  // --------------------------------------------------------------------------------
  //  Xml Parser
  // --------------------------------------------------------------------------------

  Terminal.title('Xml Parser');

  const content = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <row>
      <number>1</number>
      <street>Mermaid <b>Bold</b> avenue</street>
      <icon color="blue">gear</icon>
    </row>
    <other>
      <empty></empty>
    </other>
    <row>
      <number>2</number>
      <street>Central park</street>
      <icon color="red">alert</icon>
    </row>
  </root>`;

  const content2 = `<?xml version='1.0' encoding='utf-8'?>
  <manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.exceltaxisantcugat.user">
    <application>
    </application>
  </manifest>
  `;

  // const doc = XmlParser.parse(undefined, content);
  // const tag = XmlParser.find(doc, ((n: any) => n.name === 'icon'), { recursive: true });
  // console.log('result =', tag);

  const parser = new XmlParser(`scripts/parsers/test-result.xml`, content);
  // console.log(parser.resolvePath(`resources>string`));
  // console.log(parser.filter(undefined, node => node.type === 'XMLElement' && node.name === 'string'));

  // parser.replaceValue(`manifest package`, 'com.clickmoveapp.app');

  // parser.replaceName(`root>row[1]>icon color`, 'name');
  // parser.replaceValue(`root>row[1]>icon color`, 'value');
  parser.replaceValue(`row[1]>icon color`, 'value');
  // parser.replaceValue(`row>icon color`, 'value');
  // parser.replaceValue(`root>row[1]>icon`, 'pp');
  // parser.replaceName(`root>row[1]>icon`, 'img');
  // parser.replaceNode(`root>row[1]>icon`, '<img src="prova" />');
  // parser.replaceValue(`root>[1]>empty`, 'value');
  // parser.replaceValue(`root>[0]>[0]`, 'value');

  // const tag = parser.resolvePath(`root>row[1]>icon color`);
  // const tag: XMLAstNode = XmlParser.find(parser.document, ((n: any) => n.name === 'icon'), { recursive: true });
  // console.log(tag);

  // parser.replaceNode((tag as any), '<img src="gear" />');
  // parser.replaceNode((tag as any).attributes[0], 'size="12"');
  // parser.replaceNode((tag as any).textContents[0], 'content');

  // parser.replaceName((tag as any), 'name');
  // parser.replaceName((tag as any).attributes[0], 'name');
  // parser.replaceName((tag as any).textContents[0], 'name');

  // parser.replaceValue((tag as any), 'value');
  // parser.replaceValue((tag as any).attributes[0], 'value');
  // parser.replaceValue((tag as any).textContents[0], 'value');

  parser.save();

  Terminal.line();
});
