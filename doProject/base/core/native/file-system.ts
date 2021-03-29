import { resolveSanitizationFn } from '@angular/compiler/src/render3/view/template';
import { Injectable } from '@angular/core';
import { Plugins, FileAppendOptions, FileAppendResult, CopyOptions, CopyResult, FileReadOptions, FileReadResult, FileWriteResult, FileWriteOptions, FileDeleteOptions, FileDeleteResult, MkdirOptions, MkdirResult, RmdirOptions, RmdirResult, ReaddirOptions, ReaddirResult, GetUriOptions, GetUriResult, StatOptions, StatResult, RenameOptions, RenameResult, FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
import 'capacitor-plugin-file-downloader';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { saveAs } from 'file-saver';

import { AppConfig } from 'src/core/app-config';
import { DevicePlugin } from './device';

const { Filesystem, FileDownloader } = Plugins;


export enum FileSystemPluginDirectory {
  Download = 'DOWNLOAD',
  Documents = 'DOCUMENTS',
  Cache = 'CACHE',
  Data = 'DATA',
  External = 'EXTERNAL',
  ExternalStorage = 'EXTERNAL_STORAGE'
}

enum FileSyetemElectron {
  Download = 'downloads',
  Documents = 'documents',
  Cache = 'cache',
  Data = 'userData',
  External = 'documents',
  ExternalStorage = 'documents',
}

export interface FileExistsResult { status: boolean; fileNameFullPath?: string; systemPath?: string; message?: string; error?: string; }

export interface DownloadFileResult { status: boolean; fileName?: string; systemPath?: string; fullFileSystemPath?: string; message?: string; error?: string; }

export interface MkdirFileResult { status: boolean; message?: string; error?: string; }

export interface GenericFileResult { status: boolean; value: string; message?: string; error?: string; }

/**
 * Wrapper para el plugin `Filesystem`.
 *
 * **Cordova**
 *
 * ```typescript
 * import { Filesystem } from '@ionic-native/filesystem/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/filesystem}
 * - Api Downloader : {@link https://github.com/veluxa/capacitor-plugin-file-downloader#english}
 *
 * ```typescript
 * import 'capacitor-plugin-file-downloader';
 * import { Plugins } from '@capacitor/core';
 * const { Filesystem, FileDownloader } = Plugins;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FileSystemPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin,
    public fileOpener: FileOpener,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Read a file from disk. */
  readFile(options: FileReadOptions): Promise<FileReadResult> {
    return Filesystem.readFile(options);
  }

  /** Write a file to disk in the specified location on device. */
  writeFile(options: { fileName: string, fileType?: string, path: string, directory: FileSystemPluginDirectory, data: any, encoding?: FilesystemEncoding, recursive?: boolean }): Promise<GenericFileResult> {
    return new Promise<GenericFileResult>((resolve: any, reject: any) => {
      try {
        this.device.getInfo().then(value => {
          if (this.device.isRealPhone) {
            const fileSystemDirectory: FilesystemDirectory = this.getFileSystemDirectoryDevices(options.directory);
            Filesystem.writeFile({ path: options.path, data: options.data, directory: fileSystemDirectory, encoding: options.encoding, recursive: options.recursive }).then(results => resolve({ status: true, value: results.uri })).catch(error => reject({ status: false, message: 'FileSystemPlugin.writeFileError', error }));
          // } else if (this.device.is('electron')) {
            // const fileSystemEle = this.device.electronService.remote.require('fs');
            // this.fileExists({ path: options.path, directory: options.directory }).then(result => {
            //   if (!result.status) {
            //     const fileSystemDirectory: string = this.device.electronService.remote.app.getPath(this.getFileSystemDirectoryDesktop(options.directory));
            //     const fullPath = fileSystemDirectory + (options.path ? '/' + options.path : '');
            //     fileSystemEle.mkdirSync(fullPath, options.recursive);
            //   }
            //   resolve({ status: true });
            // });
           } else {
            if (options?.data) {
              const fileType = options.fileType || 'pdf';
              const fileName = options.fileName || 'Document.' + fileType;
              const contentType = this.getMimeType(fileType);
              const blob = this.base64toBlob(options.data, contentType);
              saveAs(blob, fileName); // FileSaver.js
            }
            // resolve({ status: false, message: 'FileSystemPlugin.writeFileFileError' });
          }
        }).catch(error => reject({ status: false, message: 'FileSystemPlugin.writeFileFileError', error }));
      } catch (error) {
        reject({ status: false, message: 'FileSystemPlugin.writeFileFileError', error });
      }
    });
  }

  /** Append to a file on disk in the specified location on device. */
  appendFile(options: FileAppendOptions): Promise<FileAppendResult> {
    return Filesystem.appendFile(options);
  }

  /** Delete a file from disk. */
  deleteFile(options: FileDeleteOptions): Promise<FileDeleteResult> {
    return Filesystem.deleteFile(options);
  }

  /** Create a directory.
   * @path : string - The path of the new directory
   * @directory : FileSystemPluginDirectory - System directory of device. to make the new directory in
   * @recursive ?: boolean; - Whether to create any missing parent directories as well. Defaults to false
   */
  mkdir(options: { path: string, directory: FileSystemPluginDirectory, recursive?: boolean }): Promise<MkdirFileResult> {
    return new Promise<MkdirFileResult>((resolve: any, reject: any) => {
      try {
        this.device.getInfo().then(value => {
          if (this.device.isRealPhone) {
            const fileSystemDirectory: FilesystemDirectory = this.getFileSystemDirectoryDevices(options.directory);
            Filesystem.mkdir({ path: options.path, directory: fileSystemDirectory, recursive: options.recursive }).then(() => resolve({ status: true })).catch(error => reject({ status: false, message: 'FileSystemPlugin.mkdirFileError', error }));
          } else if (this.device.is('electron')) {
            const fileSystemEle = this.device.electronService.remote.require('fs');
            this.fileExists({ path: options.path, directory: options.directory }).then(result => {
              if (!result.status) {
                const fileSystemDirectory: string = this.device.electronService.remote.app.getPath(this.getFileSystemDirectoryDesktop(options.directory));
                const fullPath = fileSystemDirectory + (options.path ? '/' + options.path : '');
                fileSystemEle.mkdirSync(fullPath, options.recursive);
              }
              resolve({ status: true });
            });
          } else {
            resolve({ status: false, message: 'FileSystemPlugin.mkdirFileError' });
          }
        }).catch(error => reject({ status: false, message: 'FileSystemPlugin.mkdirFileError', error }));
      } catch (error) {
        reject({ status: false, message: 'FileSystemPlugin.mkdirFileError', error });
      }
    });
  }

  /** Remove a directory. */
  rmdir(options: RmdirOptions): Promise<RmdirResult> {
    return Filesystem.rmdir(options);
  }

  /** Return a list of files from the directory (not recursive). */
  readdir(options: ReaddirOptions): Promise<ReaddirResult> {
    return Filesystem.readdir(options);
  }

  /** Return full File URI for a path and directory. */
  getUri(options: GetUriOptions): Promise<GetUriResult> {
    return Filesystem.getUri(options);
  }

  /** Return data about a file. */
  stat(options: StatOptions): Promise<StatResult> {
    return Filesystem.stat(options);
  }

  /** Rename a file or directory. */
  rename(options: RenameOptions): Promise<RenameResult> {
    return Filesystem.rename(options);
  }

  /** Copy a file or directory. */
  copy(options: CopyOptions): Promise<CopyResult> {
    return Filesystem.copy(options);
  }

  /** Open File.
   * @fileName - Filename of file example: 'image-downloaded.jpg'
   * @fileType - If you are wondering what MIME-type should you pass as the second argument to open function, Example 'application/pdf' para documento PDF, here is a list of all known MIME-types: 'http://svn.apache.org/viewvc/httpd/httpd/trunk/docs/conf/mime.types?view=co'
   * @path - Path to destination example: 'images/internet' 'images' where is folder and 'internet' is subfolder.
   * @directory - System directory of device.
   * @showDialog - Opens with system modal to open file with an already installed app.
   * Return GenericFileResult type;
   */
  openfile(options: { fileName: string, fileType: string, path: string, directory: FileSystemPluginDirectory, showDialog?: boolean }): Promise<GenericFileResult> {
    return new Promise<GenericFileResult>((resolve: any, reject: any) => {
      try {
        this.device.getInfo().then(value => {
          if (this.device.isRealPhone) {
            const fileSystemDirectory: FilesystemDirectory = this.getFileSystemDirectoryDevices(options.directory);
            const fullPath = fileSystemDirectory + '/' + options.path ? options.path + '/' + options.fileName : options.fileName;
            if (!options.showDialog) {
              this.fileOpener.open(fullPath, this.getMimeType(options.fileType))
                .then(() => resolve({ status: true, value: fullPath }))
                .catch(e => reject({ status: false, message: 'FileSystemPlugin.openfileFileError'}));
            } else {
              this.fileOpener.showOpenWithDialog(fullPath, this.getMimeType(options.fileType))
                .then(() => resolve({ status: true, value: fullPath }))
                .catch(e => reject({ status: false, message: 'FileSystemPlugin.openfileFileError'}));
            }
          }
        }).catch(error => reject({ status: false, message: 'FileSystemPlugin.openfileFileError', error }));
      } catch (error) {
        reject({ status: false, message: 'FileSystemPlugin.openfileFileError', error });
      }
    });
  }


  /** Download File a file or directory.
   * @url - Url of file exaple: 'http://www.domain.com/files/image.jpg'
   * @fileName - Filename of file example: 'image-downloaded.jpg'
   * @path - Path to destination example: 'images/internet' 'images' where is folder and 'internet' is subfolder.
   * @directory - System directory of device.
   * Return DownloadFileResult type;
   */
  downloadFile(options: { url: string, fileName: string, path: string, directory: FileSystemPluginDirectory }): Promise<DownloadFileResult> {
    return new Promise<DownloadFileResult>((resolve: any, reject: any) => {
      try {
        this.device.getInfo().then(value => {
          if (this.device.isRealPhone) {
            const fileSystemDirectory: FilesystemDirectory = this.getFileSystemDirectoryDevices(options.directory);
            const to: string = options.path ? options.path + '/' + options.fileName : options.fileName;
            this.fileExists(options).then(result => {
              if (result.status) { this.deleteFile({ path: to, directory: fileSystemDirectory }); }
              FileDownloader.download({ url: options.url, filename: options.fileName }).then(doc => {
                this.copy({
                  from: options.fileName,
                  to,
                  directory: this.getFileSystemDirectoryDevices(FileSystemPluginDirectory.Download),
                  toDirectory: fileSystemDirectory
                }).then();
              }).catch(error => {
                reject({ value: false, message: 'FileSystemPlugin.downloadFileError.errorDownload', error });
              });
            });
          } else if (this.device.is('electron')) {
            const fileSystemDirectory: string = this.device.electronService.remote.app.getPath(this.getFileSystemDirectoryDesktop(options.directory));
            const DownloadManager = this.device.electronService.remote.require('electron-download-manager');
            this.mkdir({ path: options.path, directory: options.directory, recursive: true }).then(() => {
              DownloadManager.download({
                url: options.url
              }, (error, info) => {
                if (error) {
                  reject({ value: false, message: 'FileSystemPlugin.downloadFileError.errorDownload', error });
                }
                const fileSystemDownloads = this.device.electronService.remote.app.getPath(FileSyetemElectron.Download) + '/' + options.fileName;
                const fullPath = fileSystemDirectory + '/' + options.path ? options.path + '/' + options.fileName : options.fileName;
                const fileSystemEle = this.device.electronService.remote.require('fs');
                fileSystemEle.renameSync(fileSystemDownloads, fullPath);
              });
            });
          }

        }).catch(error => reject({ status: false, message: 'FileSystemPlugin.downloadFileError', error }));
      } catch (error) {
        reject({ status: false, message: 'FileSystemPlugin.downloadFileError', error });
      }
    });
  }

  /** Check if file exist on directorSystem and path.
   * Params:
   * @fileName — Filename with extension.
   * @path - Especific path on system direcotry
   * @directory - direcotry of system type FilesystemDirectory
   * Return isfileExistResult type;
   */
  async fileExists(options: { fileName?: string, path?: string, directory: FileSystemPluginDirectory }): Promise<FileExistsResult> {
    return new Promise<FileExistsResult>((resolve: any, reject: any) => {
      try {
        this.device.getInfo().then(value => {
          if (this.device.isRealPhone) {
            const fileSystemDirectory: FilesystemDirectory = this.getFileSystemDirectoryDevices(options.directory);
            Filesystem.readdir({ path: options.path, directory: this.getFileSystemDirectoryDevices(options.directory) }).then(result => {
              if (result && result.files) {
                const found = result.files.find(element => element === options.fileName);
                if (found) {
                  Filesystem.getUri({ path: '', directory: fileSystemDirectory }).then((resutsUri: GetUriResult) => resolve({ value: true, fileNameFullPath: resutsUri.uri + '/' + options.fileName, systemPath: resutsUri.uri }).catch(error => reject({ value: false, message: 'FileSystemPlugin.isfileExistError', error })));
                }
              }
              resolve({ value: false, message: 'FileSystemPlugin.isfileExistNotFound' });
            }).catch(error => reject({ value: false, message: 'FileSystemPlugin.isfileExistError', error }));
          } else if (this.device.is('electron')) {
            const fileSystemDirectory: string = this.device.electronService.remote.app.getPath(this.getFileSystemDirectoryDesktop(options.directory));
            const fullPath = fileSystemDirectory + (options.path ? '/' + options.path : '') + (options.fileName ? '/' + options.fileName : '');
            const fileSystemEle = this.device.electronService.remote.require('fs');
            const existsSync = fileSystemEle.existsSync(fullPath);
            if (existsSync) {
              resolve({ value: true, fileNameFullPath: fullPath, systemPath: fileSystemDirectory });
            } else {
              resolve({ value: false, message: 'FileSystemPlugin.isfileExistNotFound' });
            }
          } else {
            reject({ value: false, message: 'FileSystemPlugin.isfileExistNotFound' });
          }

        }).catch(error => reject({ value: false, message: 'FileSystemPlugin.isfileExistError', error }));
      } catch (error) {
        reject({ value: false, message: 'FileSystemPlugin.isfileExistError', error });
      }
    });

  }

  getFileSystemDirectoryDevices(directory: FileSystemPluginDirectory): FilesystemDirectory {

    switch (directory) {
      case FileSystemPluginDirectory.Download:
        if (this.device.isRealPhone && this.device.is('android')) {
          return FilesystemDirectory.External;
        } else if (this.device.isRealPhone && this.device.is('ios')) {
          return FilesystemDirectory.Documents;
        }
        break;
      case FileSystemPluginDirectory.Documents:
        return FilesystemDirectory.Documents;
        break;
      case FileSystemPluginDirectory.Data:
        return FilesystemDirectory.Data;
        break;
      case FileSystemPluginDirectory.Cache:
        return FilesystemDirectory.Cache;
        break;
      case FileSystemPluginDirectory.External:
        return FilesystemDirectory.External;
        break;
      case FileSystemPluginDirectory.ExternalStorage:
        return FilesystemDirectory.ExternalStorage;
        break;
    }
  }
  getFileSystemDirectoryDesktop(directory: FileSystemPluginDirectory): FileSyetemElectron {

    switch (directory) {
      case FileSystemPluginDirectory.Download:
        return FileSyetemElectron.Download;
        break;
      case FileSystemPluginDirectory.Documents:
        return FileSyetemElectron.Documents;
        break;
      case FileSystemPluginDirectory.Data:
        return FileSyetemElectron.Data;
        break;
      case FileSystemPluginDirectory.Cache:
        return FileSyetemElectron.Cache;
        break;
      case FileSystemPluginDirectory.External:
        return FileSyetemElectron.External;
        break;
      case FileSystemPluginDirectory.ExternalStorage:
        return FileSyetemElectron.ExternalStorage;
        break;
    }
  }

  private base64toBlob(b64Data: string, contentType: string, sliceSize: number = 2048): Blob {
    contentType = contentType || '';
    sliceSize = sliceSize || 1024 * 2;
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, {type: contentType});
  }

  private getMimeType(fileType: string): string {
    switch (fileType) {
      case 'xls':
      case 'xlsx':
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';
      default: return fileType;
    }
  }

}
