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
exports.CustomDeployment = void 0;
const node_utils_1 = require("@metacodi/node-utils");
const code_deployment_1 = require("../abstract/code-deployment");
class CustomDeployment extends code_deployment_1.CodeDeployment {
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
                const fn = data.fn;
                const description = data.description;
                const args = data.arguments || [];
                if (typeof fn !== 'function') {
                    node_utils_1.Terminal.error(`No s'ha suministrat cap funció vàlida pel desplegament de codi.`);
                    resolve(false);
                }
                else {
                    node_utils_1.Terminal.success(description ? description : `Executant funció personalitzada.`);
                    node_utils_1.Terminal.indent += 1;
                    const result = yield fn(...args);
                    node_utils_1.Terminal.indent -= 1;
                    resolve(result);
                }
            }));
        });
    }
}
exports.CustomDeployment = CustomDeployment;
//# sourceMappingURL=custom-deployment.js.map