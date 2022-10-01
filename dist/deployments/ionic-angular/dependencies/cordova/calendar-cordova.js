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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarCordova = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../../../abstract/code-deployment");
const typescript_deployment_1 = require("../../../abstract/typescript-deployment");
const typescript_dependency_1 = require("../../../typescript/typescript-dependency");
const file_exists_1 = require("../../../utils/file-exists");
const typescript_import_1 = require("../../../typescript/typescript-import");
const ngModule_1 = require("../../../angular/ngModule");
class CalendarCordova extends typescript_deployment_1.TypescriptDeployment {
    constructor(data, project, options) {
        super(data, project, options);
        this.title = 'Calendar Cordova Plugin with Capacitor';
        this.readme = 'https://github.com/metacodi/test/blob/master/capacitor/calendar/README.md';
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
                if (data && data.showTitle) {
                    node_utils_1.Terminal.title(this.title);
                }
                const appModule = project.getSourceFile('src/app/app.module.ts');
                const tasks = [
                    new typescript_dependency_1.TypescriptDependency({ install: '@ionic-native/calendar', type: '--save' }),
                    new typescript_dependency_1.TypescriptDependency({ install: 'npm install cordova-plugin-calendar', type: '--save' }),
                    new typescript_import_1.TypescriptImport({ file: appModule, import: 'Calendar', from: '@ionic-native/calendar/ngx' }),
                    new ngModule_1.AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'providers', element: 'Calendar', test: (e) => e.getText() === 'Calendar' }),
                    new file_exists_1.FileExists({
                        fileName: project.rootPath('platforms/ios/build/emulator/MyApp.app/Info.plist'),
                        help: `  → More info ${chalk_1.default.blue('https://capacitor.ionicframework.com/docs/ios/configuration/')}`
                    }),
                ];
                resolve(yield this.run(tasks, project, options));
                if (data && data.showTitle) {
                    node_utils_1.Terminal.line();
                }
                resolve(true);
            }));
        });
    }
}
exports.CalendarCordova = CalendarCordova;
//# sourceMappingURL=calendar-cordova.js.map