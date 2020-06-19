#!/usr/bin/env node

const chalk = require('chalk'); // import * as chalk from 'chalk';

console.clear();

export const content = `
import { NgModule } from '@angular/core';
import { Heavy, Match, Metal } from '@angular/fake';
import { Heavy, Match, Metal } from '@angular/router';
import { StatusBar } from '@ionic-native/status-bar/ngx';


//  Goods
// --------------------------------------------------------------------------------

import {Match} from '@angular/router';
import {Match } from '@angular/router';
import { Match} from '@angular/router';
import { Match } from '@angular/router';

import {,Match} from '@angular/router';
import { , Match} from '@angular/router';
import {Match,} from '@angular/router';
import {Match , } from '@angular/router';
import {,Match,} from '@angular/router';
import { , Match , } from '@angular/router';

import { A, Match
} from '@angular/router';

import {
Match} from '@angular/router';

import
{
Match} from '@angular/router';

import {
Match
} from '@angular/router';

import { A,
  B, Match } from '@angular/router';

  import { A,
Match
} from '@angular/router';

import {A,Match} from '@angular/router';
import {A, Match} from '@angular/router';
import {A ,Match} from '@angular/router' ;
import {A , Match} from '@angular/router';

import {Match,B} from '@angular/router';
import  {Match, B} from '@angular/router';
import {Match ,B} from '@angular/router';
import { Match , B } from '@angular/router';

import {A,Match,B} from '@angular/router';
import {A, Match, B} from '@angular/router';
import { A , Match , B } from '@angular/router' ;


//  Bads
// --------------------------------------------------------------------------------

import { NoMatch } from '@angular/router';
import { MatchNo } from '@angular/router';
import {NoMatch} from '@angular/router';
import {MatchNo} from '@angular/router';

// Bad because 'router2'
import { A , Match , B } from '@angular/router2' ;
// Bad because 'frum'
import { A , Match , B } frum '@angular/router' ;
`;

export const contentMatch = `
import { A, Match, B } from '@angular/router';
import { A, B, Match} from '@angular/router';
import { Match, A, B } from '@angular/router';
import { ZZTOP } from '@angular/router';
`;

const specifier = 'Match';
const source = '@angular/router';

// const search = new RegExp(`((?:import[^}]*)(?: |\n|\t|,|\{)${specifier}(?= |,|\n|\})[^;]*(?:\'${source}\'[ ]*;))`, 'g');
// const replace = `▓\$1▓`;

// const search = new RegExp(`((?:import[^}]*))((?: |\n|\t|,|\{)${specifier}(?= |,|\n|\}))([^;]*(?:\'${source}\'[ ]*;))`, 'g');
// const replace = `▓\$1▒\$2▒\$3▓`;

// const search = new RegExp(`((?:import[^}]*))((?: |\n|\t|,|\{))(${specifier}(?= |,|\n|\}))([^;]*)((?:\'${source}\'[ ]*;))`, 'g');
// const search = new RegExp(`((?:import[ \n\t]*\{))([^}]*)([^;]*;)`, 'g');
// const search = new RegExp(`((?:import[ \n\t]*\{))([^}]*)([^;]*)((?:\'${source}\'[ ]*;))`, 'g');
const search = new RegExp(`((?:import[ \n\t]*))((?:[^}]*)?(?: |,|\n|\{){1}(?:${specifier})(?= |,|\n|\})(?:[^}]*)?\})((?:[ \n\t]+)from(?:[ \n\t]+)(?:\'${source}\'[ ]*;))`, 'g');
// const replace = `▓\$1▓`;
// const replace = `▓\$1▒\$2▓`;
const replace = `▓\$1▒\$2▒\$3▓`;
// const replace = `▓\$1▒\$2▒\$3▒\$4▓`;
// const replace = `▓\$1▒\$2▒\$3▒\$4▒\$5▓`;

// const search = new RegExp(`((?:import[^{]*)\{})((?:[\n\t\s\w, ]*))(?: |\n|\t|,|\{))(${specifier}(?= |,|\n|\}))([^;]*)((?:\'${source}\'[ ]*;))`, 'g');
// const replace = `▓\$1▒\$2▒\$3▒\$4▒\$5▓`;

const result = content.replace(search, replace);
console.log(chalk.grey(result));

// const matches = getSpecifiers(content, source);
// const matches = getSpecifiers(contentMatch, source);
// const matches = getSpecifiers(`import { Heavy, Match, Metal } from '@angular/router';`, source);
// const matches = getSpecifiers(`import {
// Heavy,
// Match,
//  Metal } from '@angular/router';`, source);
// console.log(matches);
