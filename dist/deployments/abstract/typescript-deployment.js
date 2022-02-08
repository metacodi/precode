"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypescriptDeployment = void 0;
const code_deployment_1 = require("./code-deployment");
class TypescriptDeployment extends code_deployment_1.CodeDeployment {
    constructor(data, project, options) {
        super(data, project, options);
    }
}
exports.TypescriptDeployment = TypescriptDeployment;
//# sourceMappingURL=typescript-deployment.js.map