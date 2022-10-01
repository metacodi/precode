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
exports.CodeDeployment = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_utils_1 = require("@metacodi/node-utils");
class CodeDeployment {
    constructor(data, project, options) {
        this.project = project;
        this.options = options;
        this.data = data;
    }
    static extendOptions(options) {
        if (!options) {
            options = {};
        }
        if (options.onlyTest === undefined) {
            options.onlyTest = true;
        }
        if (options.resolveOnFail === undefined) {
            options.resolveOnFail = true;
        }
        if (options.echo === undefined) {
            options.echo = true;
        }
        if (options.verbose === undefined) {
            options.verbose = false;
        }
        return options;
    }
    run(tasks, project, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                options = CodeDeployment.extendOptions(options || this.options);
                const { echo, verbose, resolveOnFail } = options;
                if (!project) {
                    project = this.project;
                }
                for (const task of tasks) {
                    if (typeof task.deploy === 'function') {
                        const result = yield task.deploy(project, options);
                        if (!result && resolveOnFail) {
                            resolve(false);
                            return;
                        }
                    }
                    else {
                        node_utils_1.Terminal.error(`No es reconeix la tasca com un desplegament de codi vàlid.`);
                        console.log(chalk_1.default.red(task));
                    }
                }
                resolve(true);
            }));
        });
    }
}
exports.CodeDeployment = CodeDeployment;
//# sourceMappingURL=code-deployment.js.map