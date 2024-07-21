"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.AppCustomers = void 0;
const node_utils_1 = require("@metacodi/node-utils");
const mysql = __importStar(require("mysql2"));
const commander_1 = __importDefault(require("commander"));
const chalk_1 = __importDefault(require("chalk"));
const typescript_parser_1 = require("../parsers/typescript-parser");
const promptOptions = commander_1.default.program.opts();
class AppCustomers {
    constructor(options) {
        this.options = options;
        this.pools = {};
        if (options.apps.endsWith('/')) {
            options.apps = options.apps.slice(1);
        }
    }
    get apps() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.apps) || ''; }
    get dataIdentifier() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.dataIdentifier) || 'data'; }
    get frontendFolder() { var _a; return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.frontendFolder) || ''; }
    getCustomerData(customer) {
        const { apps, dataIdentifier } = this;
        const parser = new typescript_parser_1.TypescriptParser(`${apps}/customers/${customer}/data.ts`);
        const data = (path) => parser.getPropertyValue(`${dataIdentifier}.${path}`);
        return { parser, data };
    }
    getCurrentCustomer(env) {
        return this.findCustomerFolder(this.getCurrentAppId(env));
    }
    getCurrentAppId(env) {
        const { apps, frontendFolder } = this;
        const frontend = `${apps}/${env}/${frontendFolder}`;
        const config = new typescript_parser_1.TypescriptParser(`${frontend}/src/config.ts`);
        const frontendAppId = config.getPropertyValue('AppConfig.app.package');
        return frontendAppId;
    }
    findCustomerFolder(appId) {
        var _a;
        const { apps } = this;
        const folders = node_utils_1.Resource.discover(`${apps}/customers/`);
        return ((_a = folders.find(d => {
            if (!d.isDirectory) {
                return false;
            }
            const dataFile = `${apps}/customers/${d.name}/data.ts`;
            if (!node_utils_1.Resource.exists(dataFile)) {
                return false;
            }
            const { data } = this.getCustomerData(d.name);
            return data('app.id') === appId;
        })) === null || _a === void 0 ? void 0 : _a.name) || '';
    }
    getAllCustomers() {
        const { apps } = this;
        const folders = node_utils_1.Resource.discover(`${apps}/customers/`);
        return folders.filter(d => {
            if (!d.isDirectory) {
                return false;
            }
            const dataFile = `${apps}/customers/${d.name}/data.ts`;
            return node_utils_1.Resource.exists(dataFile);
        }).map(value => value.name);
    }
    getCustomerVersion(customer, env) {
        const { apps } = this;
        const backend = `${apps}/${env}/backend`;
        const { ftp, remotePath } = this.getCustomerFtpClient(customer);
        ftp.download(`${remotePath}/${env}/precode.json`, `${backend}/precode.json`);
        const precodeFile = node_utils_1.Resource.open(`${backend}/precode.json`, { parseJsonFile: true });
        return precodeFile.version;
    }
    ;
    getCustomerFtpClient(customer, options) {
        const { apps } = this;
        if (!options) {
            options = {};
        }
        const ftpVar = options.ftpVar === undefined ? 'ftp' : options.ftpVar;
        const { data } = this.getCustomerData(customer);
        const host = data(`${ftpVar}.host`);
        const port = data(`${ftpVar}.port`);
        const user = data(`${ftpVar}.username`);
        const password = data(`${ftpVar}.password`);
        const remotePath = `${data(`${ftpVar}.remotePath`)}`;
        const ftp = new node_utils_1.FtpClient({ host, user, password, port });
        return { remotePath, ftp };
    }
    getPendingChanges(env, side) {
        return __awaiter(this, void 0, void 0, function* () {
            const { frontendFolder } = this;
            side = (side === 'frontend' ? frontendFolder : side);
            const relativePath = side ? `apps/${env}/${side}/` : `apps/${env}/`;
            const changes = (yield node_utils_1.Git.getPendingChanges()).filter(changed => changed.filename.startsWith(relativePath));
            changes.map(changed => changed.filename.startsWith(relativePath) ? changed.filename = changed.filename.substring(relativePath.length) : changed.filename);
            return changes;
        });
    }
    getPersistentConnecion(customer, env) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield this.getConnecion(customer, env);
            if (!pool) {
                return undefined;
            }
            const conn = yield pool.getConnection();
            return conn;
        });
    }
    getConnecion(customer, env) {
        return new Promise((resolve, reject) => {
            const poolKey = `${customer}-${env}`;
            if (!this.pools[poolKey]) {
                const { parser, data } = this.getCustomerData(customer);
                if (!parser.existsPropertyPath(`database.${env}.hostname`)) {
                    resolve(undefined);
                    return;
                }
                const config = {
                    connectionLimit: 10,
                    host: data(`database.${env}.hostname`),
                    user: data(`database.${env}.username`),
                    password: data(`database.${env}.password`),
                    database: data(`database.${env}.database`),
                };
                this.pools[poolKey] = mysql.createPool(config);
            }
            resolve(this.pools[poolKey].promise());
        });
    }
    closeConnections() {
        Object.keys(this.pools).map(key => { try {
            this.pools[key].end();
        }
        catch (ex) { } });
    }
    executeQueries(queries, env, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                options = {};
            }
            const customers = options.customers === undefined ? this.getAllCustomers() : options.customers;
            const verbose = options.verbose === undefined ? promptOptions.verbose : options.verbose;
            for (const customer of customers) {
                const conn = yield this.getPersistentConnecion(customer, env);
                if (conn) {
                    if (verbose) {
                        node_utils_1.Terminal.log(`Connected to ${chalk_1.default.bold(`${customer}`)} db`);
                    }
                    for (const query of queries) {
                        if (verbose) {
                            node_utils_1.Terminal.log(chalk_1.default.blueBright(query));
                        }
                        yield conn.query(query);
                    }
                    this.closeConnections();
                }
                else {
                    if (verbose) {
                        node_utils_1.Terminal.warning(`No existeix l'entorn ${chalk_1.default.green(`${env}`)} per ${chalk_1.default.bold(`${customer}`)}`);
                    }
                }
            }
        });
    }
}
exports.AppCustomers = AppCustomers;
//# sourceMappingURL=app-customers.js.map