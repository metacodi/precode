"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpDeployment = void 0;
const code_deployment_1 = require("./code-deployment");
class PhpDeployment extends code_deployment_1.CodeDeployment {
    constructor(data, project, options) {
        super(data, project, options);
    }
}
exports.PhpDeployment = PhpDeployment;
//# sourceMappingURL=php-deployment.js.map