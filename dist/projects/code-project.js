#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.CodeProject = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const rxjs_1 = require("rxjs");
const mysql = __importStar(require("mysql"));
const terminal_1 = require("../utils/terminal");
const resource_1 = require("../utils/resource");
class CodeProject {
    constructor(projectPath) {
        this.projectPath = projectPath || process.cwd();
        this.name = this.projectPath.split('/').pop();
    }
    static execute(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                terminal_1.Terminal.log(`${chalk_1.default.blue(command)}`);
                child_process_1.exec(command, (error, stdout, stderr) => {
                    if (error) {
                        terminal_1.Terminal.error(error);
                        reject(false);
                    }
                    else {
                        if (stdout) {
                            terminal_1.Terminal.log(stdout);
                        }
                        if (stderr) {
                            terminal_1.Terminal.log(chalk_1.default.yellow(`${stderr}`));
                        }
                        resolve(true);
                    }
                });
            });
        });
    }
    static install(folder, dependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            const curDir = process.cwd();
            process.chdir(folder);
            for (const dep of dependencies) {
                if (typeof dep === 'string') {
                    yield CodeProject.execute(dep);
                }
            }
            process.chdir(curDir);
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = 'precode.json';
            return new Promise((resolve, reject) => {
                try {
                    if (!fs.existsSync(this.projectPath)) {
                        terminal_1.Terminal.error(`No s'ha trobat la carpeta del projecte ${chalk_1.default.bold(this.projectPath)}`);
                        reject();
                    }
                    terminal_1.Terminal.log(chalk_1.default.bold('Directori del projecte: ') + terminal_1.Terminal.file(this.projectPath));
                    resolve(true);
                }
                catch (error) {
                    terminal_1.Terminal.error(error);
                    reject(error);
                }
            });
        });
    }
    install(dependencies) {
        return __awaiter(this, void 0, void 0, function* () {
            return CodeProject.install(this.projectPath, dependencies);
        });
    }
    read(fileName, fromPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullName = this.rootPath(fileName, this.projectPath);
            if (!resource_1.Resource.exists(fullName)) {
                terminal_1.Terminal.error(`No s'ha trobat l'arxiu '${terminal_1.Terminal.file(fullName)}'...`);
            }
            else {
                return resource_1.Resource.open(fullName, { parseJsonFile: false });
            }
        });
    }
    file(fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            if (options.saveOnContentChanges === undefined) {
                options.saveOnContentChanges = true;
            }
            if (options.appendRatherThanOverwrite === undefined) {
                options.appendRatherThanOverwrite = false;
            }
            options.content = options.content || '';
            if (options.contentFromFile) {
                options.content = yield this.read(options.contentFromFile);
            }
            const fullName = this.rootPath(fileName);
            try {
                if (!resource_1.Resource.exists(fullName)) {
                    terminal_1.Terminal.success(`Creant arxiu '${terminal_1.Terminal.file(fileName)}'.`);
                }
                else {
                    if (!options.content) {
                        terminal_1.Terminal.verbose(`Llegint arxiu '${terminal_1.Terminal.file(fileName)}'.`);
                        options.content = yield resource_1.Resource.open(fullName);
                    }
                    else {
                        terminal_1.Terminal.success(`Actualitzant arxiu '${terminal_1.Terminal.file(fileName)}'.`);
                        if (options.appendRatherThanOverwrite) {
                            const content = (yield resource_1.Resource.open(fullName)) || '';
                            options.content = content + '\n' + options.content;
                        }
                    }
                }
                options.content = this.replaces(fileName, options);
                if (options.copy) {
                    terminal_1.Terminal.success(`Copiant arxiu a '${terminal_1.Terminal.file(options.copy)}'.`);
                    fs.writeFileSync(resource_1.Resource.concat(this.projectPath, options.copy), options.content);
                }
                fs.writeFileSync(fullName, options.content);
                terminal_1.Terminal.blob(chalk_1.default.grey(options.content));
                return options.content;
            }
            catch (error) {
                terminal_1.Terminal.error(error);
            }
        });
    }
    exists(fileName) {
        return resource_1.Resource.isAccessible(this.rootPath(fileName));
    }
    replaces(fileName, options) {
        if (options.replaces && options.replaces.length) {
            terminal_1.Terminal.log(`Actualitzant codi de l'arxiu '${terminal_1.Terminal.file(fileName)}'.`);
            for (const action of options.replaces) {
                let descartado = false;
                if (!!action.skip) {
                    if (typeof action.skip === 'string') {
                        action.skip = new RegExp(action.skip);
                    }
                    if (action.skip.test(options.content)) {
                        descartado = true;
                        terminal_1.Terminal.verbose(`- S'ha descartat substituir l'expressió perquè ja existeix.`);
                    }
                }
                if (!descartado) {
                    if (typeof action.replace === 'function') {
                    }
                    else {
                        if (action.global === undefined) {
                            action.global = true;
                        }
                        if (action.insensitive === undefined) {
                            action.insensitive = false;
                        }
                        const flags = [action.global ? 'g' : '', action.insensitive ? 'i' : ''].filter(s => !!s).join('');
                        terminal_1.Terminal.log(action.description ? '- ' + action.description : `- Substituint l'expressió: ` + chalk_1.default.grey(action.match.toString()) + ' (flags:' + flags + ')');
                        options.content = options.content.replace(new RegExp(action.match, flags), action.replace || '');
                    }
                }
            }
        }
        else {
        }
        return options.content;
    }
    folder(folderName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            if (!options.action) {
                options.action = 'add';
            }
            const fullName = this.rootPath(folderName);
            if (resource_1.Resource.exists(fullName)) {
                if (options.action === 'remove') {
                    terminal_1.Terminal.success(`  Eliminant la carpeta '${terminal_1.Terminal.file(folderName)}'.`);
                    const command = process.platform === 'win32' ? `rmdir /S /Q "${fullName}"` : `rm -Rf ${fullName}`;
                    return yield this.execute(command);
                }
                else {
                    terminal_1.Terminal.verbose(`- Ja existeix la carpeta '${terminal_1.Terminal.file(folderName)}'`);
                    return true;
                }
            }
            else {
                if (options.action === 'add') {
                    terminal_1.Terminal.success(`  Creant la carpeta '${terminal_1.Terminal.file(folderName)}'.`);
                    const command = process.platform === 'win32' ? `mkdir "${fullName}"` : `mkdir ${fullName}`;
                    return yield this.execute(command);
                }
                else if (options.action === 'remove') {
                    terminal_1.Terminal.success(`  La carpeta ja estava eliminada '${terminal_1.Terminal.file(folderName)}'`);
                    return true;
                }
                else {
                    terminal_1.Terminal.warning(`- No es reconeix el tipus d'acció '${options.action}' per la carpeta '${terminal_1.Terminal.file(folderName)}'`);
                    return false;
                }
            }
        });
    }
    clone(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const git = { url: this.config.git.url, token: this.config.git.token };
            const from = options.from.startsWith('http') ? options.from : `${git.url}/${options.from}`;
            const to = this.rootPath(options.to);
            if (options.removePreviousFolder === undefined) {
                options.removePreviousFolder = true;
            }
            if (options.removePreviousFolder && resource_1.Resource.exists(to)) {
                yield this.remove(options.to);
            }
            const command = `git clone ${from} ${to}`;
            terminal_1.Terminal.log(`Clonant repositori '${terminal_1.Terminal.file(from.replace(`gitlab-ci-token:${git.token}@`, ''))}'...`);
            return yield this.execute(command);
        });
    }
    curl(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.headers === undefined) {
                options.headers = [];
            }
            const token = options.token || '';
            const method = options.method || 'GET';
            const headers = Object.keys(options.headers).map(prop => `--header '${prop}: ${options.headers[prop]}'`).join(' ') || '';
            const url = options.url || '';
            const to = this.rootPath(options.to);
            const command = `curl -sb --request ${method} ${headers} ${url} ${to}`;
            terminal_1.Terminal.log(`Curl ${method} '${terminal_1.Terminal.file(url.replace(`--header 'PRIVATE-TOKEN: ${token}`, ''))}'...`);
            return yield this.execute(command);
        });
    }
    move(fromPath, toPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = this.rootPath(fromPath);
            const to = this.rootPath(toPath);
            if (!resource_1.Resource.exists(from)) {
                if (!resource_1.Resource.exists(to)) {
                    terminal_1.Terminal.warning(`No s'ha trobat la carpeta d'origen '${terminal_1.Terminal.file(fromPath)}'.`);
                }
                else {
                    terminal_1.Terminal.verbose(`La carpeta ja estava moguda a '${terminal_1.Terminal.file(fromPath)}'.`);
                }
            }
            else {
                const command = process.platform === 'win32' ? `move "${from}" "${to}"` : `mv ${from} ${to}`;
                terminal_1.Terminal.log(`Movent de '${terminal_1.Terminal.file(fromPath, toPath)}' fins a ${terminal_1.Terminal.file(toPath, fromPath)}'...`);
                return yield this.execute(command);
            }
        });
    }
    remove(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullName = this.rootPath(name);
            if (resource_1.Resource.exists(fullName)) {
                const stat = fs.lstatSync(fullName);
                if (stat.isFile()) {
                    const command = process.platform === 'win32' ? `del "${fullName}"` : `rm -Rf ${fullName}`;
                    terminal_1.Terminal.log(`Eliminant '${terminal_1.Terminal.file(name)}'...`);
                    return yield CodeProject.execute(command);
                }
                else {
                    const command = process.platform === 'win32' ? `rmdir /Q /S "${fullName}"` : `rm -Rf ${fullName}`;
                    terminal_1.Terminal.log(`Eliminant '${terminal_1.Terminal.file(name)}'...`);
                    return yield CodeProject.execute(command);
                }
            }
            else {
                terminal_1.Terminal.verbose(`La carpeta no existeix '${terminal_1.Terminal.file(fullName)}'.`);
                return yield rxjs_1.of().toPromise();
            }
        });
    }
    execute(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return CodeProject.execute(command);
        });
    }
    rootPath(fileName, folder) {
        if (path.isAbsolute(fileName)) {
            return fileName;
        }
        else {
            if (folder) {
                fileName = resource_1.Resource.normalize(path.join(folder, fileName));
            }
            return resource_1.Resource.normalize(resource_1.Resource.concat(this.projectPath, fileName));
        }
    }
    relativePath(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return fileName;
        }
        const idx = fileName.indexOf(this.projectPath);
        if (idx > -1) {
            return fileName.substring(idx);
        }
    }
    connect(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const pool = mysql.createPool(config);
                pool.getConnection((err, connection) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    this.connection = connection;
                    terminal_1.Terminal.verbose('MySQL connected!');
                    resolve(connection);
                }));
            });
        });
    }
    query(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.connection) {
                    this.connection.query(sql, (err, results) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(results);
                    });
                }
                else {
                    const error = 'No hi ha cap connexió oberta disponible.';
                    terminal_1.Terminal.error(error);
                    reject(error);
                }
            });
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                if (typeof this.connection.release === 'function') {
                    this.connection.release();
                    terminal_1.Terminal.verbose('MySQL connection closed!');
                }
                else if (typeof this.connection.end === 'function') {
                    this.connection.end();
                    terminal_1.Terminal.verbose('MySQL connection closed!');
                }
            }
        });
    }
}
exports.CodeProject = CodeProject;
//# sourceMappingURL=code-project.js.map