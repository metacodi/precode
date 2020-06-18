#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node src/scripts/ionic-angular/test-deployments.ts -v
 *  npx ts-node src/scripts/ionic-angular/test-deployments.ts -d C:\Users\Jordi\work\metacodi\tools\test-project\frontend -v
 *  npx ts-node src/scripts/ionic-angular/test-deployments.ts -f src/app/app.module.ts -v
 *
 * -------------------------------------------------------------------------------- */


import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

import * as fs from 'fs';
import * as ts from 'typescript';
import { CodeProject, TextReplacer } from '../../code';
import { i18n } from '../../code/deployments/ionic-angular/i18n';
import * as mysql from 'mysql';
import { Terminal } from '../../utils/terminal';
import { TypescriptProject } from '../../code/typescript-project';

// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt
// .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
// .requiredOption('-f, --file <file>', 'Arxiu de codi.')
  .option('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

console.clear();

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }

// // const fileName = Prompt.file; // process.argv[1]
// // const sourceCode = fs.readFileSync(fileName, 'utf-8');
// // const sourceFile: ts.SourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, /* setParentNodes */ true);

// // console.log('Prompt.directory', Prompt.directory);
// // console.log('__dirname', __dirname);
// // console.log('Prompt.directory || __dirname', Prompt.directory || __dirname);
const project: TypescriptProject = new TypescriptProject(Prompt.directory || __dirname);

project.initialize().then(async () => {

  // await project.connect({
  //   connectionLimit : 10,
  //   host: 'mysql-5703.dinaserver.com',
  //   user: 'pre_user_db',
  //   password: 'JCW4xe8xa5d7f',
  //   database: 'pre_excel_db'
  // });

  // const results = await project.query('SELECT idreg, name FROM `roles`');

  // console.log('results => ', JSON.stringify(results, null, '  '));

  // await project.closeConnection();

  // i18n.deploy(project).then(() => {
  //   console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n${Terminal.line}\n`);
  // });

  const Di18n = new i18n(project);
  Di18n.deploy();
  Di18n.test();

  project.install([Di18n]).then(() => {
    console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n${Terminal.line}\n`);
  });


});


/*
288=SourceFile
  225=ExpressionStatement
    192=ObjectLiteralExpression
      279=PropertyAssignment
        10=StringLiteral
        192=ObjectLiteralExpression
          279=PropertyAssignment
            10=StringLiteral
            10=StringLiteral
          279=PropertyAssignment
            10=StringLiteral
            10=StringLiteral
      279=PropertyAssignment
        10=StringLiteral
        192=ObjectLiteralExpression
          279=PropertyAssignment
            10=StringLiteral
            10=StringLiteral
          279=PropertyAssignment
            10=StringLiteral
            10=StringLiteral
*/

// process.exit(0);
// console.log(process.env);
// process.stdout.end();
