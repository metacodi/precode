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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const terminal_1 = require("./terminal");
class Resource {
    static concat(folder, fileName) {
        if (!folder) {
            return fileName;
        }
        if (!fileName) {
            return folder;
        }
        const concat = (folder.endsWith('/') || folder.endsWith('\\')) ? '' : '/';
        const file = (fileName.startsWith('/') || fileName.startsWith('\\')) ? fileName.substring(1) : fileName;
        return Resource.normalize(folder + concat + file);
    }
    static normalize(fileName) {
        const find = process.platform === 'win32' ? '/' : '\\\\';
        const replace = process.platform === 'win32' ? '\\' : '/';
        return fileName.replace(new RegExp(find, 'g'), replace);
    }
    static open(fileName) {
        try {
            let content = fs.readFileSync(fileName).toString();
            const file = Resource.discover(fileName);
            if (file.extension === '.json') {
                if (file.name.startsWith('tsconfig')) {
                    content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
                }
                return JSON.parse(content);
            }
            return content;
        }
        catch (err) {
            terminal_1.Terminal.error(`Error parsejant l'arxiu JSON '${terminal_1.Terminal.file(fileName)}'.`, false);
            return undefined;
        }
    }
    static save(fileName, content, options) {
        try {
            if (!options) {
                options = {};
            }
            const file = Resource.discover(fileName);
            if (file.extension === '.json' && typeof content === 'object') {
                content = JSON.stringify(content, null, 2);
            }
            fs.writeFileSync(fileName, content, options);
            return true;
        }
        catch (err) {
            terminal_1.Terminal.error(`Error parsejant l'arxiu JSON '${terminal_1.Terminal.file(fileName)}'.`, false);
            return false;
        }
    }
    static exists(resource) {
        try {
            fs.existsSync(resource);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isAccessible(resource) {
        try {
            fs.accessSync(resource, fs.constants.F_OK);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isReadable(resource) {
        try {
            fs.accessSync(resource, fs.constants.R_OK);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isWriteable(resource) {
        try {
            fs.accessSync(resource, fs.constants.W_OK);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    static isReadOnly(resource) {
        return this.isAccessible(resource) && this.isReadable(resource) && !this.isWriteable(resource);
    }
    static discover(resource, options, indent = '') {
        if (!options) {
            options = {};
        }
        if (options.ignore === undefined) {
            options.ignore = 'node_modules|\.git';
        }
        if (options.recursive === undefined) {
            options.recursive = false;
        }
        if (typeof options.ignore === 'string') {
            options.ignore = new RegExp(options.ignore);
        }
        if (typeof options.filter === 'string') {
            options.filter = new RegExp(options.filter);
        }
        if (!fs.existsSync(resource) || !Resource.isAccessible(resource)) {
            terminal_1.Terminal.error(`No existeix el recurs '${terminal_1.Terminal.file(resource)}'`);
            return [];
        }
        const content = [];
        const resourceIsDirectory = fs.lstatSync(resource).isDirectory();
        const resources = resourceIsDirectory ? fs.readdirSync(resource) : [path.basename(resource)];
        resource = resourceIsDirectory ? resource : path.dirname(resource);
        for (const name of Object.values(resources)) {
            const fullName = path.join(resource, name);
            const stat = fs.statSync(fullName);
            if (Resource.isAccessible(fullName) && (!options.ignore || !options.ignore.test(name)) && (!options.filter || options.filter.test(name))) {
                const info = {
                    name,
                    path: resource,
                    fullName,
                    isDirectory: stat.isDirectory(),
                    isFile: stat.isFile(),
                    extension: stat.isDirectory() ? '' : path.extname(name),
                    size: stat.size,
                    created: stat.birthtime,
                    modified: stat.mtime,
                };
                if (resourceIsDirectory) {
                    content.push(info);
                }
                else {
                    return info;
                }
                if (info.isDirectory && options.recursive) {
                    info.children = this.discover(fullName, options, indent + '  ');
                }
            }
        }
        return content;
    }
    static copyFileSync(source, target, options) {
        if (!options) {
            options = {};
        }
        if (options.indent === undefined) {
            options.indent = '';
        }
        const verbose = options.verbose === undefined ? terminal_1.Terminal.verboseEnabled : !!options.verbose;
        const file = path.basename(source);
        if (verbose) {
            console.log(options.indent + chalk_1.default.green('√'), file);
        }
        let targetFile = target;
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }
    static copyFolderSync(source, target, options) {
        if (!options) {
            options = {};
        }
        if (options.indent === undefined) {
            options.indent = '';
        }
        if (options.createFolderInTarget === undefined) {
            options.createFolderInTarget = true;
        }
        const verbose = options.verbose === undefined ? terminal_1.Terminal.verboseEnabled : !!options.verbose;
        const indent = options.indent + '  ';
        const filter = options.filter;
        const files = [];
        const targetFolder = options.createFolderInTarget ? path.join(target, path.basename(source)) : target;
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }
        if (verbose && options.createFolderInTarget) {
            console.log(options.indent + '> ' + chalk_1.default.bold(path.basename(source)));
        }
        let copied = 0;
        if (fs.lstatSync(source).isDirectory()) {
            files.push(...fs.readdirSync(source));
            files.forEach((file) => {
                const origin = path.join(source, file);
                if (fs.lstatSync(origin).isDirectory()) {
                    if (Resource.applyFilter(origin, options.filter) && Resource.hasFiles(origin, filter)) {
                        copied += Resource.copyFolderSync(origin, targetFolder, { indent, verbose, filter });
                    }
                    else {
                    }
                }
            });
            files.forEach((file) => {
                const origin = path.join(source, file);
                if (!fs.lstatSync(origin).isDirectory()) {
                    if (Resource.applyFilter(origin, options.filter)) {
                        Resource.copyFileSync(origin, targetFolder, { indent, verbose });
                        copied++;
                    }
                    else {
                    }
                }
            });
        }
        return copied;
    }
    static hasFiles(folder, filter) {
        if (fs.lstatSync(folder).isDirectory()) {
            for (const file of fs.readdirSync(folder)) {
                const origin = path.join(folder, file);
                if (fs.lstatSync(origin).isFile()) {
                    if (Resource.applyFilter(origin, filter)) {
                        return true;
                    }
                }
                else {
                    if (Resource.applyFilter(origin, filter) && Resource.hasFiles(origin, filter)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    static applyFilter(file, filter) {
        if (!filter) {
            return true;
        }
        if (typeof filter === 'string') {
            const tester = new RegExp(filter);
            return tester.test(file);
        }
        else if (typeof filter === 'object' && typeof filter.test === 'function') {
            return filter.test(file);
        }
        else if (typeof filter === 'function') {
            return filter(file);
        }
        else {
            return true;
        }
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map