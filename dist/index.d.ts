#!/usr/bin/env node
export { AppApiClient, AppApiOptions } from './app/app-api-client';
export { ApiEntitySchema, ApiEntityFieldSchema, ApiEntityRelationSchema } from './app/api-entity-schema';
export { AppTools, AppToolsOptions } from './app/app-tools';
export { TextReplacement } from './parsers/types';
export { TypescriptParser, PrimitiveType, ComplexPrimitiveType, BasicPrimitiveType, EmptyPrimitiveType } from './parsers/typescript-parser';
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
export { TextReplacer } from './utils/text-replacer';
export * from './work-arounds/work-around';
//# sourceMappingURL=index.d.ts.map