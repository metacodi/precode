"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IonicAngularAppCore = void 0;
const node_utils_1 = require("@metacodi/node-utils");
const ionic_angular_deployment_1 = require("../../abstract/ionic-angular-deployment");
const code_deployment_1 = require("../../abstract/code-deployment");
const typescript_dependency_1 = require("../../typescript/typescript-dependency");
const i18n_1 = require("../../angular/i18n");
const push_capacitor_1 = require("./capacitor/push-capacitor");
const typescript_constructor_1 = require("../../typescript/typescript-constructor");
class IonicAngularAppCore extends ionic_angular_deployment_1.IonicAngularDeployment {
    static deploy(project, options, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new IonicAngularAppCore(data || {}, project, options);
            if (instance.title) {
                node_utils_1.Terminal.title(instance.title);
            }
            return instance.deploy();
        });
    }
    constructor(data, project, options) {
        super(data, project, options);
        this.title = `Install Ionic Angular App Core`;
    }
    deploy(project, options, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                options = code_deployment_1.CodeDeployment.extendOptions(options || this.options);
                if (!project) {
                    project = this.project;
                }
                if (!data) {
                    data = this.data;
                }
                const appModule = project.getSourceFile('src/app/app.module.ts');
                const appComponent = project.getSourceFile('src/app/app.component.ts');
                const classe = project.findClassDeclaration('AppComponent', appComponent);
                const tasks = [
                    new i18n_1.I18n(),
                    new push_capacitor_1.PushCapacitor(),
                    new typescript_dependency_1.TypescriptDependency({ install: 'moment' }),
                    new typescript_dependency_1.TypescriptDependency({ install: 'file-saver' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@types/file-saver', type: '--save-dev' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@ionic-native/core' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@ionic-native/status-bar' }),
                    new typescript_dependency_1.TypescriptDependency({ install: 'cordova-plugin-brightness' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@ionic-native/brightness' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@ionic-native/android-fingerprint-auth' }),
                    new typescript_dependency_1.TypescriptDependency({ install: 'cordova-plugin-android-fingerprint-auth' }),
                    new typescript_dependency_1.TypescriptDependency({ install: 'https://github.com/fabiorogeriosj/cordova-plugin-sensors.git', dependency: 'cordova-plugin-sensors' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@ionic-native/sensors' }),
                    new typescript_constructor_1.TypescriptConstructor({ file: appComponent, identifier: 'lang', type: 'AppLanguageService' }),
                ];
                resolve(yield this.run(tasks, project, options));
            }));
        });
    }
}
exports.IonicAngularAppCore = IonicAngularAppCore;
//# sourceMappingURL=ionic-angular-app-core.js.map