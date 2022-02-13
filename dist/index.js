#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FtpClient = exports.Git = exports.TextReplacer = exports.Terminal = exports.Resource = exports.PushCapacitor = exports.IonicAngularAppCore = exports.I18n = exports.AngularNgModule = exports.TypescriptImport = exports.TypescriptDependency = exports.TypescriptConstructor = exports.IonicAngularDeployment = exports.AngularDeployment = exports.TypescriptDeployment = exports.CodeDeployment = exports.IonicAngularProject = exports.AngularProject = exports.TypescriptProject = exports.CodeProject = void 0;
__exportStar(require("./parsers/typescript-parser"), exports);
var code_project_1 = require("./projects/code-project");
Object.defineProperty(exports, "CodeProject", { enumerable: true, get: function () { return code_project_1.CodeProject; } });
var typescript_project_1 = require("./projects/typescript-project");
Object.defineProperty(exports, "TypescriptProject", { enumerable: true, get: function () { return typescript_project_1.TypescriptProject; } });
var angular_project_1 = require("./projects/angular-project");
Object.defineProperty(exports, "AngularProject", { enumerable: true, get: function () { return angular_project_1.AngularProject; } });
var ionic_angular_project_1 = require("./projects/ionic-angular-project");
Object.defineProperty(exports, "IonicAngularProject", { enumerable: true, get: function () { return ionic_angular_project_1.IonicAngularProject; } });
__exportStar(require("./projects/types"), exports);
var code_deployment_1 = require("./deployments/abstract/code-deployment");
Object.defineProperty(exports, "CodeDeployment", { enumerable: true, get: function () { return code_deployment_1.CodeDeployment; } });
var typescript_deployment_1 = require("./deployments/abstract/typescript-deployment");
Object.defineProperty(exports, "TypescriptDeployment", { enumerable: true, get: function () { return typescript_deployment_1.TypescriptDeployment; } });
var angular_deployment_1 = require("./deployments/abstract/angular-deployment");
Object.defineProperty(exports, "AngularDeployment", { enumerable: true, get: function () { return angular_deployment_1.AngularDeployment; } });
var ionic_angular_deployment_1 = require("./deployments/abstract/ionic-angular-deployment");
Object.defineProperty(exports, "IonicAngularDeployment", { enumerable: true, get: function () { return ionic_angular_deployment_1.IonicAngularDeployment; } });
var typescript_constructor_1 = require("./deployments/typescript/typescript-constructor");
Object.defineProperty(exports, "TypescriptConstructor", { enumerable: true, get: function () { return typescript_constructor_1.TypescriptConstructor; } });
var typescript_dependency_1 = require("./deployments/typescript/typescript-dependency");
Object.defineProperty(exports, "TypescriptDependency", { enumerable: true, get: function () { return typescript_dependency_1.TypescriptDependency; } });
var typescript_import_1 = require("./deployments/typescript/typescript-import");
Object.defineProperty(exports, "TypescriptImport", { enumerable: true, get: function () { return typescript_import_1.TypescriptImport; } });
var ngModule_1 = require("./deployments/angular/ngModule");
Object.defineProperty(exports, "AngularNgModule", { enumerable: true, get: function () { return ngModule_1.AngularNgModule; } });
var i18n_1 = require("./deployments/angular/i18n");
Object.defineProperty(exports, "I18n", { enumerable: true, get: function () { return i18n_1.I18n; } });
var ionic_angular_app_core_1 = require("./deployments/ionic-angular/dependencies/ionic-angular-app-core");
Object.defineProperty(exports, "IonicAngularAppCore", { enumerable: true, get: function () { return ionic_angular_app_core_1.IonicAngularAppCore; } });
var push_capacitor_1 = require("./deployments/ionic-angular/dependencies/capacitor/push-capacitor");
Object.defineProperty(exports, "PushCapacitor", { enumerable: true, get: function () { return push_capacitor_1.PushCapacitor; } });
var resource_1 = require("./utils/resource");
Object.defineProperty(exports, "Resource", { enumerable: true, get: function () { return resource_1.Resource; } });
var terminal_1 = require("./utils/terminal");
Object.defineProperty(exports, "Terminal", { enumerable: true, get: function () { return terminal_1.Terminal; } });
var text_replacer_1 = require("./utils/text-replacer");
Object.defineProperty(exports, "TextReplacer", { enumerable: true, get: function () { return text_replacer_1.TextReplacer; } });
var git_1 = require("./utils/git");
Object.defineProperty(exports, "Git", { enumerable: true, get: function () { return git_1.Git; } });
var ftp_1 = require("./utils/ftp");
Object.defineProperty(exports, "FtpClient", { enumerable: true, get: function () { return ftp_1.FtpClient; } });
//# sourceMappingURL=index.js.map