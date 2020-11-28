#!/usr/bin/env node
import ts, { updateImportEqualsDeclaration } from 'typescript';
import chalk from 'chalk';
/// <reference types="node" />

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node scripts\ionic-angular\generate.ts -f C:\Users\Jordi\work\metacodi\taxi\apps\pre\logic-taxi\src\app\acciones -s accion
 * ```
 *
 * `gen.bat`
 * ```bash
 * echo off
 * cls
 * set cur=%cd%
 * cd C:\Users\Jordi\work\metacodi\tools\precode\scripts\ionic-angular\
 * if [%2]==[] (npx ts-node generate.ts -f %cur%\%1 && cd %cur%)
 * if [%2] NEQ [] (npx ts-node generate.ts -f %cur%\%1 -s %2 && cd %cur%)
 * ```
 */

import Prompt from 'commander';
import { TypescriptParser } from '../../src/parsers/typescript-parser';
import { IonicAngularProject } from '../../src/projects/ionic-angular-project';
import { Terminal } from '../../src/utils/terminal';

Prompt
  .requiredOption('-f, --file <permissions file>', 'Ruta absoluta a l\'arxiu de definició dels permissos.')
  .requiredOption('-s, --server <ftp server>', 'Servidor')
  .requiredOption('-d, --directory <ftp directory>', 'Directori del servidor')
  .requiredOption('-c, --credentials <credentials>', 'Credencials d\'usuari')
  .option('-v, --verbose', 'Log verbose')
  .option('-h, --ajuda', 'Ajuda')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

if (Prompt.ajuda) {
  console.clear();

  Terminal.title(' Ajuda');
  Terminal.log(Terminal.green('-f, --file <permissions file>') + '  Ruta absoluta a l\'arxiu de definició dels permissos.');
  Terminal.log(Terminal.green('-s, --server <ftp server>') + '  Servidor ftp sense protocol.');
  Terminal.log(Terminal.green('-d, --directory <ftp directory>') + '  Directori ftp de destí de l\'arxiu. Ex: "/www/taxi/pre/downloads"');
  Terminal.log(Terminal.green('-c, --credentials <credentials>') + '  Credencials d\'usuari en forma "usuari:password"');

  Terminal.subtitle(' Exemple:');
  Terminal.log(Terminal.yellow('npx ts-node permissions.ts -d  -f C:/Users/jordi/work/metacodi/taxi/pre/logic-taxi/src/app/configuracion/roles/permissions/permissions.ts'));

  process.exit();
}

const bad = process.platform === 'win32' ? '/' : '\\\\';
const sep = process.platform === 'win32' ? '\\' : '/';

Prompt.file = Prompt.file.replace(new RegExp(bad, 'g'), sep);

Terminal.log(chalk.bold('Parsing: '), Terminal.green(Prompt.file));

// Trobem la carpeta del projecte ionic-angular.
let directory: string = Prompt.file;
do {
  const dir = directory.split(sep);
  dir.pop();
  directory = dir.join(sep);
} while (directory && !IonicAngularProject.isProjectFolder(directory));
if (!directory) { Terminal.error(`No s'ha trobat la carpeta del projecte`); process.exit(1); }

Terminal.log(chalk.bold('Parsing2: '), Terminal.green(Prompt.file));

// Creem una nova instància del projecte.
const project = new IonicAngularProject(directory);
project.initialize().then(async () => {

  const sourceFile: ts.SourceFile = TypescriptParser.parse(Prompt.file);

  // Terminal.log(chalk.bold('source: '), Terminal.green(sourceFile.text));

  TypescriptParser.filter(sourceFile.statements, ts.SyntaxKind.VariableStatement, { firstOnly: false }).map((node: ts.VariableStatement) => {
    // Terminal.log(chalk.bold('Node: '), Terminal.green(node.getText()));
    // Terminal.log(chalk.bold('Node: '), Terminal.green(JSON.stringify(node)));

    node.declarationList.declarations.map(d => {
      // Terminal.log(chalk.bold('Variable: '), Terminal.green(d.name.getText()));
      if (d.name.getText() === 'permissions') {
        const text = d.getText();
        // Terminal.log(chalk.bold('Variable Text: '), Terminal.green(text));
        const value = text.split('=')[1];
        const perm = eval(value);
        const json = JSON.stringify(perm, null, '  ');
        Terminal.log(Terminal.green(json));

        // Guardamos el archivo.
        project.file('permissions.json', { content: json }).then(() => {
          // Upload del JSON a api.
          const localFile = project.rootPath('permissions.json');
          const command = `curl -T ${localFile} ftp://${Prompt.server} --user ${Prompt.credentials} -d ${Prompt.directory}`;
          Terminal.log(Terminal.yellow(command));
          project.execute(command);
        });

      }
    });

    // if (node.name.text === 'permissions') {
    //   Terminal.log(Terminal.green(node.exportClause.getText()));
    // }
  });

});
