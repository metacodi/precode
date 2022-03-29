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

import { Terminal } from '../../src/utils/terminal';

import { CodeProject } from '../../src';
import { JavaParser } from '../../src/parsers/java-parser';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt
  // .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
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
//  Java Parser
// --------------------------------------------------------------------------------

Terminal.title('Java Parser');

const content = `package com.exceltaxisantcugat.user;

import android.os.Bundle;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      add(SpeechRecognition.class);
      add(FCMPlugin.class);
    }});
  }
}
`;

const parser = new JavaParser(`scripts/parsers/test-result.java`, content);
// console.log(parser.resolvePath(`resources>string`));
// console.log(parser.filter(undefined, node => node.type === 'XMLElement' && node.name === 'string'));

parser.save();

Terminal.line();
