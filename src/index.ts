#!/usr/bin/env node

// ---------------------------------------------------------------------------------------------------
//  Project
// ---------------------------------------------------------------------------------------------------

/* Code Project */
export { CodeDeployment } from './code-deployment';
export { CodeProject } from './code-project';
export * from './code-project-types';

/* Typescript Project */
export { TypescriptDeployment } from './typescript-deployment';
export { TypescriptProject } from './typescript-project';
export * from './typescript-project-types';


// ---------------------------------------------------------------------------------------------------
//  Deployments
// ---------------------------------------------------------------------------------------------------

/* Ionic + Angular */
export { i18n } from './deployments/ionic-angular/i18n';
export { PushCapacitor } from './deployments/ionic-angular/push-capacitor';


// ---------------------------------------------------------------------------------------------------
//  Utils
// ---------------------------------------------------------------------------------------------------

export { Resource } from './utils/resource';
export { Terminal, chalkColor } from './utils/terminal';
export { TextReplacer, TextReplacement } from './utils/text-replacer';

