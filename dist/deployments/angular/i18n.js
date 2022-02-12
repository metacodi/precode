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
exports.I18n = void 0;
const code_deployment_1 = require("../abstract/code-deployment");
const angular_deployment_1 = require("../abstract/angular-deployment");
const typescript_dependency_1 = require("../typescript/typescript-dependency");
const typescript_import_1 = require("../typescript/typescript-import");
const ngModule_1 = require("./ngModule");
const custom_deployment_1 = require("../utils/custom-deployment");
class I18n extends angular_deployment_1.AngularDeployment {
    constructor(data, project, options) {
        super(data, project, options);
        this.title = 'i18n - Translate Module';
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
                const tasks = [
                    new typescript_dependency_1.TypescriptDependency({ install: '@ngx-translate/core' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@ngx-translate/http-loader' }),
                    new typescript_import_1.TypescriptImport({ file: appModule, import: 'TranslateModule', from: '@ngx-translate/core' }),
                    new typescript_import_1.TypescriptImport({ file: appModule, import: 'TranslateLoader', from: '@ngx-translate/core' }),
                    new typescript_import_1.TypescriptImport({ file: appModule, import: 'TranslateHttpLoader', from: '@ngx-translate/http-loader' }),
                    new typescript_import_1.TypescriptImport({ file: appModule, import: 'HttpClientModule', from: '@angular/common/http' }),
                    new typescript_import_1.TypescriptImport({ file: appModule, import: 'HttpClient', from: '@angular/common/http' }),
                    new ngModule_1.AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'imports', element: 'HttpClientModule', test: (e) => e.getText() === 'HttpClientModule' }),
                    new ngModule_1.AngularNgModule({ file: appModule, ngModule: 'AppModule', property: 'imports', element: 'TranslateModule', test: (e) => e.getText().startsWith('TranslateModule'), text: `TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),
        deps: [HttpClient]
      }
    })`, }),
                    new custom_deployment_1.CustomDeployment({
                        description: `Comprovant els arxius JSON de traducció.`,
                        fn: () => __awaiter(this, void 0, void 0, function* () {
                            yield project.folder('src/assets/i18n');
                            if (!project.exists('src/assets/i18n/es.json')) {
                                yield project.file('src/assets/i18n/es.json', { content: `{}` });
                            }
                            return true;
                        })
                    }),
                ];
                resolve(yield this.run(tasks, project, options));
            }));
        });
    }
}
exports.I18n = I18n;
//# sourceMappingURL=i18n.js.map