#!/usr/bin/env node
export { JavaParser } from './parsers/java-parser';
export { PhpParser } from './parsers/php-parser';
export { TypescriptParser } from './parsers/typescript-parser';
export { XmlParser } from './parsers/xml-parser';
export { CodeProject } from './projects/code-project';
export { TypescriptProject } from './projects/typescript-project';
export { AngularProject } from './projects/angular-project';
export { IonicAngularProject } from './projects/ionic-angular-project';
export * from './projects/types';
export { CodeDeployment } from './deployments/abstract/code-deployment';
export { TypescriptDeployment } from './deployments/abstract/typescript-deployment';
export { AngularDeployment } from './deployments/abstract/angular-deployment';
export { IonicAngularDeployment } from './deployments/abstract/ionic-angular-deployment';
export { TypescriptConstructor } from './deployments/typescript/typescript-constructor';
export { TypescriptDependency } from './deployments/typescript/typescript-dependency';
export { TypescriptImport } from './deployments/typescript/typescript-import';
export { AngularNgModule } from './deployments/angular/ngModule';
export { I18n } from './deployments/angular/i18n';
export { IonicAngularAppCore } from './deployments/ionic-angular/dependencies/ionic-angular-app-core';
export { PushCapacitor } from './deployments/ionic-angular/dependencies/capacitor/push-capacitor';
export { Resource, ResourceType } from './utils/resource';
export { Terminal, ChalkColor } from './utils/terminal';
export { TextReplacer, TextReplacement } from './utils/text-replacer';
//# sourceMappingURL=index.d.ts.map