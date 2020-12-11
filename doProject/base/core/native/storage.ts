import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';


const { Storage } = Plugins;

/**
 * Wrapper para el plugin `Storage`.
 *
 * Añade información del módulo (aplicación) al prinicipio de las claves.
 *
 * **Cordova**
 *
 * - Repo: {@link https://github.com/xpbrew/cordova-sqlite-storage}
 *
 * ```bash
 * ionic cordova plugin add cordova-sqlite-storage
 * npm install @ionic/storage --save
 * ```
 * ```typescript
 * import { Storage } from '@ionic/storage';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/storage}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { Storage } = Plugins;
 *
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class StoragePlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor() {
    if (this.debug) { console.log(this.constructor.name + '.constructor() -> AppConfig =>', AppConfig); }
  }

  get packageName(): string {
    return AppConfig && AppConfig.app ? AppConfig.app.package || '' : '';
  }

  /** Clear the entire key value of app storage. */
  clear(moduleName?: string): Promise<void> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.keys(moduleName).then(keys => {
        const promises: Promise<any>[] = [];
        keys.forEach((key: any) => promises.push(this.remove(key)));
        forkJoin(promises).pipe(first()).subscribe(() => resolve(true));
      });
    });
  }

  /** Get the value associated with the given key. */
  async get(key: string, moduleName?: string): Promise<any> {
    const appName: string = this.packageName + (moduleName ? '.' + moduleName : '');
    return Storage.get({key : `${appName}.${key}`}).then(value => {
      return value?.value ? JSON.parse(value.value) : undefined;
    });
    // return new Promise<{value: string}>((resolve: any, reject: any) => {
    //     const appName: string = this.packageName + (moduleName ? '.' + moduleName : '');
    //     Storage.get({key : `${appName}.${key}`}).then(value => {
    //       resolve(value && value.value ? JSON.parse(value.value) : undefined);
    //     }).catch(error => reject(error));
    // });
  }

  /** Returns a promise that resolves with the keys in the app storage. */
  keys(moduleName?: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
        const appName: string = this.packageName + (moduleName ? '.' + moduleName : '');
        Storage.keys().then(result => {
          // resolve(result.keys.filter(key => key.startsWith(`${appName}.`)).map(key => key.slice(0, `${appName}.`.length)));
          resolve(result.keys.filter(key => key.startsWith(`${appName}.`)).map(key => key.slice(`${appName}.`.length)));
        }).catch(error => reject(error));
    });
  }

  /** Returns a promise that resolves with the number of keys app storage. */
  length(moduleName?: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.keys(moduleName).then(keys => resolve(keys.length)).catch(error => reject(error));
    });
  }


  /** Remove any value associated with this key. */
  remove(key: string, moduleName?: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
        const appName: string = this.packageName + (moduleName ? '.' + moduleName : '');
        Storage.remove({key: `${appName}.${key}`}).then(() => {
          resolve(true);
        }).catch(error => reject(error));
    });
  }

  /** Set the value for the given key. */
  set(key: string, value: any, moduleName?: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
        const appName: string = this.packageName + (moduleName ? '.' + moduleName : '');
        Storage.set({ key: `${appName}.${key}`, value: value ? JSON.stringify(value) : value}).then(() => {
          resolve(true);
      }).catch(error => reject(error));
    });
  }

}
