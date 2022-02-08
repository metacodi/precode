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
exports.CapacitorCore = void 0;
const code_deployment_1 = require("../../../abstract/code-deployment");
const typescript_deployment_1 = require("../../../abstract/typescript-deployment");
const typescript_dependency_1 = require("../../../typescript/typescript-dependency");
class CapacitorCore extends typescript_deployment_1.TypescriptDeployment {
    constructor(data, project, options) {
        super(data, project, options);
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
                const tasks = [
                    new typescript_dependency_1.TypescriptDependency({ install: '@capacitor/core', type: '--save' }),
                    new typescript_dependency_1.TypescriptDependency({ install: '@capacitor/cli', type: '--save-dev' }),
                ];
                resolve(yield this.run(tasks, project, options));
            }));
        });
    }
}
exports.CapacitorCore = CapacitorCore;
//# sourceMappingURL=capacitor-core.js.map