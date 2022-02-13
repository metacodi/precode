#!/usr/bin/env node


// ---------------------------------------------------------------------------------------------------
//  Parsers
// ---------------------------------------------------------------------------------------------------

// export * from './parsers/java-parser';
// export * from './parsers/php-parser';
export * from './parsers/typescript-parser';
// export * from './parsers/xml-parser';


// ---------------------------------------------------------------------------------------------------
//  Projects
// ---------------------------------------------------------------------------------------------------

export { CodeProject } from './projects/code-project';
export { TypescriptProject } from './projects/typescript-project';
export { AngularProject } from './projects/angular-project';
export { IonicAngularProject } from './projects/ionic-angular-project';

/** types */
export * from './projects/types';


// ---------------------------------------------------------------------------------------------------
//  Deployments
// ---------------------------------------------------------------------------------------------------

/* Abstract */
export { CodeDeployment } from './deployments/abstract/code-deployment';
export { TypescriptDeployment } from './deployments/abstract/typescript-deployment';
export { AngularDeployment } from './deployments/abstract/angular-deployment';
export { IonicAngularDeployment } from './deployments/abstract/ionic-angular-deployment';

/* Typescript */
export { TypescriptConstructor } from './deployments/typescript/typescript-constructor';
export { TypescriptDependency } from './deployments/typescript/typescript-dependency';
export { TypescriptImport } from './deployments/typescript/typescript-import';

/* Angular */
export { AngularNgModule } from './deployments/angular/ngModule';
export { I18n } from './deployments/angular/i18n';

/* Ionic + Angular */
export { IonicAngularAppCore } from './deployments/ionic-angular/dependencies/ionic-angular-app-core';
export { PushCapacitor } from './deployments/ionic-angular/dependencies/capacitor/push-capacitor';


// ---------------------------------------------------------------------------------------------------
//  Utils
// ---------------------------------------------------------------------------------------------------

export { Resource, ResourceType } from './utils/resource';
export { Terminal, ChalkColor } from './utils/terminal';
export { TextReplacer, TextReplacement } from './utils/text-replacer';
export { Git } from './utils/git';
export { FtpClient, FtpUploadOptions } from './utils/ftp';
