#!/usr/bin/env node
/// <reference types="node" />


import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';
// import { RegularFileNode, DirectoryNode, FileNode } from "@ionic/utils-fs";

// import fs from 'fs';
import * as fs from 'fs';
import * as ts from 'typescript';

// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt
  // .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  .requiredOption('-f, --file <file>', 'Arxiu de codi.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

console.clear();

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }

// const inputFile = process.argv[2];
const inputFile = Prompt.file;
const sourceCode = fs.readFileSync(inputFile, 'utf-8');
const sourceFile = ts.createSourceFile(inputFile, sourceCode, ts.ScriptTarget.Latest, true);

console.log('\n\n');
console.log('--------------------------------------------------------------------------------');
console.log('statements.length = ', sourceFile.statements.length);
console.log('ts.SyntaxKind.SourceFile = ', ts.SyntaxKind.ImportDeclaration);
if (sourceFile.statements.length) {
  let lastImport: ts.Statement;
  sourceFile.statements.forEach(s => { if (s.kind === ts.SyntaxKind.ImportDeclaration) { lastImport = s; } });
  console.log(lastImport.getText());
  
//   console.log(sourceFile.statements[0]);
// } else {
//   // console.log(JSON.stringify(sourceFile, null, 2));
//   console.log(sourceFile);
}


