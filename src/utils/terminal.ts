import chalk from 'chalk';
import Prompt from 'commander';
import * as path from 'path';

export type chalkColor = 'green' | 'black' | 'blue' | 'cyan' | 'gray' | 'green'
| 'grey' | 'magenta' | 'red' | 'white' | 'yellow';

export class Terminal {

  /** Quan s'estableix a `false` les funcions `verbose` i `blob` no escriuen res per consola. */
  static verboseEnabled = true;

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
    if (Terminal.verboseEnabled) {
      if (data === undefined) {
        console.log(message);
      } else {
        console.log(message, data);
      }
    }
  }

  /** @category Log */
  static blob(content: string) {
    if (Terminal.verboseEnabled) {
      Terminal.line();
      console.log(content);
      Terminal.line();
    }
  }

  /** @category Log */
  static warning(message: string): void {
    console.log(chalk.bold.yellow('WARN: ') + chalk.yellow(message) + '\n');
  }

  /** @category Log */
  static error(error: any, exit = true): void {
    const message = typeof error === 'string' ? error : error.error || error.message || 'Error desconegut';
    console.log(chalk.bold.red('ERROR: ') + chalk.red(message));
    if (exit) { Terminal.line(); process.exit(1); }
  }

  /** @category Log */
  static file(fileName: string, relativeTo?: string): string {
    // console.log(`fileName => `, fileName);
    // console.log(`fileName.replace('\\', '/') => `, fileName.replace('\\', '/'));
    // console.log(`fileName.replace('\\', '/').lastIndexOf('/') => `, fileName.replace('\\', '/').lastIndexOf('/'));
    const i = relativeTo ? Terminal.relative(fileName, relativeTo) : fileName.split('\\').join('/').lastIndexOf('/');
    // const i = relativeTo ? Terminal.relative(fileName, relativeTo) : fileName.length - path.dirname(fileName).length;
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
  //  Test result
  // --------------------------------------------------------------------------------

  /**
   * Escriu un text amb un check verd davant.
   * @category Test result
   */
  static success(message: string, check = '√'): void {
    Terminal.log(`${chalk.bold.green(check)} ${message}`);
  }

  /**
   * Escriu un text amb una creu vermella davant.
   * @category Test result
   */
  static fail(error: string, check = 'x'): void {
    Terminal.log(`${chalk.bold.red(check)} ${error}`);
  }


  // --------------------------------------------------------------------------------
  //  Sections
  // --------------------------------------------------------------------------------

  /** @category Sections */
  static line(color?: chalkColor): void {
    const line = `--------------------------------------------------------------------------------`;
    console.log(Terminal.colorize(color, line));
  }

  /** @category Sections */
  static double(color?: chalkColor): void {
    const line = `================================================================================`;
    console.log(Terminal.colorize(color, line));
  }

  /** @category Sections */
  static title(title: string, color?: chalkColor): void {
    Terminal.line(color);
    console.log(Terminal.colorize(color, chalk.bold(title)));
    Terminal.line(color);
  }

  /** @category Color */
  static colorize(color: chalkColor, value: any): string {
    const colorizer = Terminal.color(color);
    if (colorizer) {
      return colorizer(value);
    } else {
      return value;
    }
  }

  /** @category Color */
  static color(color?: chalkColor): chalk.Chalk {
    switch (color) {
      case 'green': return chalk.green;
      case 'black': return chalk.black;
      case 'blue': return chalk.blue;
      case 'cyan': return chalk.cyan;
      case 'gray': return chalk.gray;
      case 'green': return chalk.green;
      case 'grey': return chalk.grey;
      case 'magenta': return chalk.magenta;
      case 'red': return chalk.red;
      case 'white': return chalk.white;
      case 'yellow': return chalk.yellow;
      default:
        return undefined;
    }
  }
}
