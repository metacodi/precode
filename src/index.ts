#!/usr/bin/env node

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
export { TypescriptDependency } from './deployments/typescript/typescript-dependency';
export { TypescriptImport } from './deployments/typescript/typescript-import';

/* Angular */
export { AngularNgModule } from './deployments/angular/angular-ngModule';
export { i18n } from './deployments/angular/i18n';

/* Ionic + Angular */
export { PushCapacitor } from './deployments/ionic-angular/push-capacitor';


// ---------------------------------------------------------------------------------------------------
//  Utils
// ---------------------------------------------------------------------------------------------------

export { Resource, ResourceType } from './utils/resource';
export { Terminal, chalkColor } from './utils/terminal';
export { TextReplacer, TextReplacement } from './utils/text-replacer';

