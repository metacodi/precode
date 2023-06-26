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
exports.PushCapacitor = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../../../abstract/code-deployment");
const typescript_deployment_1 = require("../../../abstract/typescript-deployment");
const typescript_dependency_1 = require("../../../typescript/typescript-dependency");
const capacitor_core_1 = require("./capacitor-core");
const file_exists_1 = require("../../../utils/file-exists");
class PushCapacitor extends typescript_deployment_1.TypescriptDeployment {
    constructor(data, project, options) {
        super(data, project, options);
        this.title = 'Push Notifications with Capacitor';
        this.readme = 'https://github.com/metacodi/test/blob/master/capacitor/pushnotifi/README.md';
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
                const tasks = [
                    new capacitor_core_1.CapacitorCore(),
                    new typescript_dependency_1.TypescriptDependency({ install: '@capacitor-community/fcm', type: '--save' }),
                    new file_exists_1.FileExists({
                        fileName: project.rootPath('GoogleService-Info.plist'),
                        help: `  → Download from ${chalk_1.default.blue('https://firebase.google.com/docs?authuser=0')}`
                    }),
                ];
                if (data && data.showTitle) {
                    node_utils_1.Terminal.line();
                }
                resolve(yield this.run(tasks, project, options));
            }));
        });
    }
}
exports.PushCapacitor = PushCapacitor;
//# sourceMappingURL=push-capacitor.js.map