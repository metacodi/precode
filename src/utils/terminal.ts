import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';

export class Terminal {

  // --------------------------------------------------------------------------------
  //  Log & Error
  // --------------------------------------------------------------------------------

  /** @category Log */
  static log(message: string, data?: any) {
    // if (Prompt.verbose) {
      if (data === undefined) {
        console.log(message);
      } else {
        console.log(message, data);
      }
    // }
  }

  /** @category Log */
  static verbose(message: string, data?: any) {
    if (Prompt.verbose) {
      if (data === undefined) {
        console.log(message);
      } else {
        console.log(message, data);
      }
    }
  }

  /** @category Log */
  static blob(content: string) {
    if (Prompt.verbose) {
      console.log(Terminal.line + '\n' + content + Terminal.line);
    }
  }

  /** @category Log */
  static warning(message: string): void {
    console.log(chalk.bold.yellow('WARN: ') + chalk.yellow(message) + '\n');
  }

  /** @category Log */
  static error(error: any, exit = true): void {
    const message = typeof error === 'string' ? error : error.error || error.message || 'Error desconegut';
    console.log(chalk.bold.red('ERROR: ') + chalk.red(message) + (exit ? `\n\n${Terminal.line}\n` : ''));
    if (exit) { process.exit(1); }
  }

  /** @category Log */
  static chalkFile(fileName: string, relativeTo?: string): string {
    const i = relativeTo ? Terminal.relative(fileName, relativeTo) : fileName.lastIndexOf('/');
    if (i > 0) {
      const base = fileName.substr(0, i + 1);
      const name = fileName.substr(i + 1);
      // return chalk.blue(base) + chalk.bold.blue(name);
      return chalk.green(base) + chalk.bold.green(name);

    } else {
      // return chalk.cyan(fileName);
      return chalk.green(fileName);
    }
  }

  /** @category Log */
  static relative(from: string, to: string) {
    let i = 0;
    while (i < Math.min(from.length, to.length)) {
      if (from.charAt(i) !== to.charAt(i)) { return i - 1; }
      i++;
    }
    return i - 1;
  }


  // --------------------------------------------------------------------------------
  //  Source file
  // --------------------------------------------------------------------------------

  /** Escriu un text amb un check verd davant. */
  static success(message: string): void {
    Terminal.log(`${chalk.green(chalk.bold('√'))} ${message}.`);
  }

  /** Escriu un text amb una creu vermella davant. */
  static fail(error: string): void {
    Terminal.log(`${chalk.red(chalk.bold('x'))} ${error}.`);
  }


  /** @category Sections */
  static line(): void {
    console.log(`--------------------------------------------------------------------------------`);
  }

  /** @category Sections */
  static double(): void {
    console.log(`================================================================================`);
  }

  /** @category Sections */
  static title(title: string): void {
    Terminal.line();
    console.log(chalk.blueBright(chalk.bold(title)));
    Terminal.line();
  }

}
