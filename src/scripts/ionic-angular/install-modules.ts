#!/usr/bin/env node
/// <reference types="node" />

/* --------------------------------------------------------------------------------
 *
 *  npx ts-node src/scripts/ionic-angular/install-modules.ts -v
 *  npx ts-node src/scripts/ionic-angular/install-modules.ts -d C:\Users\Jordi\work\metacodi\tools\precode\ -v
 *  npx ts-node src/scripts/ionic-angular/install-modules.ts -f src/app/app.module.ts -v
 *
 * -------------------------------------------------------------------------------- */


import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';
// import { RegularFileNode, DirectoryNode, FileNode } from "@ionic/utils-fs";

// import fs from 'fs';
import * as fs from 'fs';
import * as ts from 'typescript';
import { CodeProject, TextReplacer } from '../../code';
import { i18n } from '../../code/modules/i18n';
import * as mysql from 'mysql';

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
const project: CodeProject = new CodeProject(Prompt.directory || __dirname, __dirname, Prompt.system || 'dos');

project.initialize().then(async () => {

  await project.connect({
    connectionLimit : 10,
    host: 'mysql-5703.dinaserver.com',
    user: 'pre_user_db',
    password: 'JCW4xe8xa5d7f',
    database: 'pre_excel_db'
  });

  // const results = await project.query('SELECT idreg, name FROM `roles`');

  // console.log('results => ', JSON.stringify(results, null, '  '));

  await project.closeConnection();

//   // project.install([i18n, i18n]);
//   // console.log(project.chalkFile('src/app/app.module.ts'));
//   // project.file('src/app/api.json', {
//   project.file('src/app/api.php', {
//     replaces: [{
//       description: 'test json',
//       replace: (file: ts.SourceFile, replacer: TextReplacer) => {
//         const visit = (node: ts.Node, indent = '') => {
//           console.log(indent + node.kind + '=' + ts.SyntaxKind[node.kind]);
//           console.log(node.getText());
//           // console.log(node);
//           // console.log(indent + node.kind + '=' + ts.SyntaxKind[node.kind]);
//           node.forEachChild(n => visit(n, indent + '  '));
//           // if (node.kind !== 279) {
//           //   node.forEachChild(n => visit(n, indent += '  '));
//           // } else {
//           //   // console.log(indent + node.getText());
//           //   console.log(node);
//           // }
//         };
//         // visit(file);
//         file.forEachChild(n => visit(n));
//         // // file.statements[0].forEachChild(n => visit(n));
//         // const stat = file.statements[0] as ts.ExpressionStatement;
//         // console.log(stat.getText());
//         // const obj = stat.expression as ts.ObjectLiteralExpression;
//         // const entity = obj.properties[0] as ts.PropertyAssignment;
//         // console.log('property name = ', entity.name);
//         // visit(entity);
//       }
//     }]
//   });


  console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n${project.line}\n`);

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
