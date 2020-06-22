#!/usr/bin/env node
/// <reference types="node" />

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node src/scripts/ionic/start.ts -d C:\Users\Jordi\work\metacodi\meta-controller -s windows
 * ```
 */

import chalk from 'chalk'; // const chalk = require('chalk');
import Prompt from 'commander';
// import { RegularFileNode, DirectoryNode, FileNode } from "@ionic/utils-fs";

import { CodeProject } from '../../code/code-project';
// import { CodeProjectConfig } from '../../code/code-project-types';
import * as resource from './resources/resources';
import fs from 'fs';
import { TypescriptProject } from '../../code/typescript-project';
import { Terminal } from '../../utils/terminal';


// --------------------------------------------------------------------------------
//  Arguments
// --------------------------------------------------------------------------------

Prompt
  .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-s, --system <system>', 'Sistema operativo: windows | linux')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log(chalk.bold('Arguments: ')); console.log(Prompt.opts()); }

console.clear();


// --------------------------------------------------------------------------------
//  Install
// --------------------------------------------------------------------------------

const project = new TypescriptProject(Prompt.directory);

project.initialize().then(async () => {

  // const app: CodeProjectConfig['app'] = project.config.app;
  // const api: CodeProjectConfig['api'] = project.config.api;
  // const git: CodeProjectConfig['git'] = project.config.git;

  // if (!api.url) { api.url = { dev: '', pro: '' }; }
  // if (!api.url.dev) { api.url.dev = ''; }
  // if (!api.url.pro) { api.url.pro = ''; }

  // --------------------------------------------------------------------------------

  // await project.file('src/tslint.json', { contentFromFile: 'resources/tslint.json' });

  // await project.file('src/config.ts', { content: await project.read(`resources/config.ts`),
  //   replaces: [
  //     { contains: `(?:name):\s*\'(?:${app.name})\'`, match: `{{app.name}}`, replace: app.name, },
  //     { contains: `(?:package):\s*\'(?:${app.package})\'`, match: `{{app.package}}`, replace: app.package, },
  //     { contains: `(?:url):\s*\'(?:${api.url})\'`, match: `{{api.url.pro}}`, replace: api.url.pro, },
  //     { contains: `(?:url):\s*\'(?:${api.url})\'`, match: `{{api.url.dev}}`, replace: api.url.dev, },
  //   ],
  // });


  // await project.install([
  //   `npm install @ionic-native/keyboard --save`,
  //   `ionic cordova plugin add cordova-plugin-ionic-keyboard`,
  // ]);


  // await project.install([
  //   `npm install @ionic/storage --save`,
  //   // `ionic cordova plugin add cordova-sqlite-storage`,
  // ]);


  // await project.install([
  //   'npm install @ionic-native/network --save',
  //   'ionic cordova plugin add cordova-plugin-network-information',
  // ]);
  // await project.file('src/app/app.module.ts', {
  //   imports: [
  //     { action: 'add', specifiers: [ 'Network' ], module: '@ionic-native/network/ngx' },
  //   ],
  //   replaces: [{
  //     description: 'Afegint el preveïdor Network...',
  //     contains: /(\@NgModule\(\{(?:.|\r|\n)*  Network(?:,?))/,
  //     match: /(\@NgModule\(\{(?:.|\r|\n)*\n  providers(?:(\s)*)\:(?:(\s)*)\[)(?:\n?)*(?:\s?)*/,
  //     replace: `\$1\n    Network,\n    `,
  //   }],
  // });


  await project.install([
    `npm install @ngx-translate/core --save`,
    `npm install @ngx-translate/http-loader --save`,
  ]);
  await project.folder('src/assets/i18n');
  await project.file('src/assets/i18n/es.json', { contentFromFile: 'resources/i18n/es.json' });
  await project.fileImports('src/app/app.module.ts', [
    { action: 'add', specifiers: [ 'TranslateModule', 'TranslateLoader' ], module: '@ngx-translate/core' },
    { action: 'add', specifiers: [ 'TranslateHttpLoader' ], module: '@ngx-translate/http-loader' },
    { action: 'add', specifiers: [ 'HttpClientModule', 'HttpClient' ], module: '@angular/common/http' },
  ]);
  await project.file('src/app/app.module.ts', {
    replaces: [{
      description: 'Afegint importació de HttpClientModule al mòdul de traducció...',
      skip: /(\@NgModule\(\{(?:.|\r|\n)*)(?:HttpClientModule)/,
      match: /(\@NgModule\(\{(?:.|\r|\n)*\n  imports(?:(\s)*)\:(?:(\s)*)\[)(?:\n?)*(?:\s?)*/,
      replace: `\$1\n    HttpClientModule,\n    `,
    }, {
      description: 'Afegint importació de TranslateModule al mòdul de traducció...',
      skip: /(\@NgModule\(\{(?:.|\r|\n)*)(?:TranslateModule.forRoot\()/,
      match: /(\@NgModule\(\{(?:.|\r|\n)*\n  imports(?:(\s)*)\:(?:(\s)*)\[)(?:\n?)*(?:\s?)*/,
      replace: `\$1\n    TranslateModule.forRoot({\n      loader: {\n        provide: TranslateLoader,\n        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),\n        deps: [HttpClient]\n      }\n    }),\n    `,
    }],
  });

  // await project.file('src/app/app.component.ts', {
  //   imports: [
  //     { action: 'add', specifiers: ['TranslateService'], module: '@ngx-translate/core' }
  //   ],
  //   replaces: [{
  //     description: 'Afegint translate.setDefaultLang al component d\'inici...',
  //     skip: /this.translate.setDefaultLang/,
  //     match: /(initializeApp\(\)(?:(\s)*)\{)(?:(\s|\n)?)*(?:\s?)*/,
  //     replace: `\$1\n    this.translate.setDefaultLang(AppConfig.language.default);\n    `,
  //   },{
  //     description: 'Afegint translate al constructor...',
  //     skip: /translate: TranslateService/,
  //     match: /(constructor\()/,
  //     replace: `\$1\n    public translate: TranslateService,`,
  //   }],
  // });

  // await project.clone({ from: `${git.url}/tools/app-core.git`, to: 'src/app/core' });

  // await project.folder('src/app/global');

  // await project.folder('src/app/modules');

  // await project.remove('src/app/list');

  // await project.remove('src/app/app-routing.module.ts');

  await project.fileImports('src/app/app.module.ts', [
    { action: 'remove', specifiers: [ 'AppRoutingModule' ], module: './app-routing.module' },
    // { specifiers: [ 'Routes' ], module: '@angular/router' },
  ]),
  // await project.file('src/app/app.module.ts', {
  //   replaces: [{
  //     match: /(\@NgModule\(\{(?:.|\r|\n)*)(?:AppRoutingModule(?:,?))((.|\n)*)/,
  //     replace: '\$1\$2',
  //   }, {
  //     skip: 'const routes: Routes = ',
  //     match: /(((\s|\n)*import[^;]*;)*)((\s|\n)*)/,
  //     replace: `\$1\n${resource.homeRoutes}\n`,
  //   }],
  // });

  // --------------------------------------------------------------------------------

  // await project.file('src/app/model.ts', { content: resource.model,
  //   replaces: [
  //     { skip: `(?:name):\s*\'(?:${app.name})\'`, match: `{{app.name}}`, replace: app.name, },
  //     { skip: `(?:id):\s*\'(?:${app.package})\'`, match: `{{app.package}}`, replace: app.package, },
  //     // { skip: `(?:url):\s*\'(?:${api.url})\'`, match: `{{api.url.pro}}`, replace: api.url.pro, },
  //     // { skip: `(?:url):\s*\'(?:${api.url})\'`, match: `{{api.url.dev}}`, replace: api.url.dev, },
  //   ],
  // });

  // await project.move('src/app/home', 'src/app/modules/home');

  // await project.file('src/app/modules/home/home.module.ts', { content: resource.HomeModule });

  // await project.file('src/app/modules/home/home.page.ts', { content: resource.HomePageTS });

  // await project.folder('src/assets/fonts');

  // await project.file('src/theme/fonts.scss', { content: resource.Fonts });

  // // await project.file('src/environments/environment.ts', {
  // //   replaces: [{
  // //     description: `Afegint la propietat 'debugEnabled' a sota de 'production'.`,
  // //     skip: /debugEnabled/,
  // //     match: /(production:\s*(?:true|false))(?:,?)/,
  // //     replace: '\$1,\n  debugEnabled: true',
  // //   }, {
  // //     description: `Afegint la informació de l'api.`,
  // //     skip: /\s*api:\s*{\s*url:/,
  // //       match: /(debugEnabled:\s*(?:true|false))(?:,?)/,
  // //       replace: `\$1,\n  api: \{\n    url: \'${api.url.dev}\',\n\  },`,
  // //     }, {
  // //     description: `Afegint la informació de l'app.`,
  // //     skip: /\s*app:\s*{\s*(?:name|id):/,
  // //     match: /(debugEnabled:\s*(?:true|false))(?:,?)/,
  // //     replace: `\$1,\n  app: \{\n    name: \'${project.name}\',\n    id: ${app.id},\n\  },`,
  // //   }],
  // // });

  // // await project.file('src/environments/environment.ts', { copy: 'src/environments/environment.develop.ts' });

  // // await project.file('src/environments/environment.prod.ts', {
  // //   replaces: [{
  // //     description: `Afegint la propietat 'debugEnabled' a sota de 'production'.`,
  // //     contains: /debugEnabled/,
  // //     match: /(production:\s*(?:true|false))(?:,?)/,
  // //     replace: '\$1,\n  debugEnabled: false',
  // //   }, {
  // //     description: `Afegint la informació de l'api.`,
  // //     contains: /\s*api:\s*{\s*url:/,
  // //     match: /(debugEnabled:\s*(?:true|false))(?:,?)/,
  // //     replace: `\$1,\n  api: \{\n    url: \'${api.url.pro}\',\n\  },`,
  // //   }, {
  // //     description: `Afegint la informació de l'app.`,
  // //     contains: /\s*app:\s*{\s*(?:name|id):/,
  // //     match: /(debugEnabled:\s*(?:true|false))(?:,?)/,
  // //     replace: `\$1,\n  app: \{\n    name: \'${project.name}\',\n    id: ${app.id},\n\  },`,
  // //   }],
  // // });

  console.log(`\n${chalk.bold('Procés finalitzat amb èxit!!')}\n\n`);
  Terminal.line();

});
