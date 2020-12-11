import { Injectable } from '@angular/core';
import { Plugins, FileAppendOptions, FileAppendResult, CopyOptions, CopyResult, FileReadOptions, FileReadResult, FileWriteResult, FileWriteOptions, FileDeleteOptions, FileDeleteResult, MkdirOptions, MkdirResult, RmdirOptions, RmdirResult, ReaddirOptions, ReaddirResult, GetUriOptions, GetUriResult, StatOptions, StatResult, RenameOptions, RenameResult } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';


const { Filesystem } = Plugins;

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
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { Filesystem } = Plugins;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FileSystemPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor() {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Read a file from disk. */
  readFile(options: FileReadOptions): Promise<FileReadResult> {
    return Filesystem.readFile(options);
  }

  /** Write a file to disk in the specified location on device. */
  writeFile(options: FileWriteOptions): Promise<FileWriteResult> {
    return Filesystem.writeFile(options);
  }

  /** Append to a file on disk in the specified location on device. */
  appendFile(options: FileAppendOptions): Promise<FileAppendResult> {
    return Filesystem.appendFile(options);
  }

  /** Delete a file from disk. */
  deleteFile(options: FileDeleteOptions): Promise<FileDeleteResult> {
    return Filesystem.deleteFile(options);
  }

  /** Create a directory.. */
  mkdir(options: MkdirOptions): Promise<MkdirResult> {
    return Filesystem.mkdir(options);
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


}
