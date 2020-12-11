import { Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { StoragePlugin } from 'src/core/native';


export interface UserSettings {
  idreg: number;
  key: string;
  blobVersion: number;
  userVersion: number;
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public storage: StoragePlugin,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  // ---------------------------------------------------------------------------------------------------
  //  request
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene las versiones de los ajustes de usuario solicitados. */
  resume(keyOrId?: 'check' | 'force' | string | string[] | number | number[]): Promise<UserSettings[]> {
    return new Promise<any>((resolve: any, reject: any) => {
      // Obtenemos las versiones del storage.
      this.versions().then((versions: UserSettings[]) => {
        // Si se han solicitado todas las versiones incluyendo las nuevas.
        if (keyOrId === 'force') { resolve(''); }
        // Si no se ha indicado ningún id, devolvemos las versiones registradas.
        if (!keyOrId || keyOrId === 'check') { resolve(versions); }
        // Nos aseguramos que es un array.
        const keysOrIds = Array.isArray(keyOrId) ? keyOrId : [keyOrId as string | number];
        // Si no hay info de versiones, devolvemos los ids solicitados (sin version, para q los recupere todos).
        if (!versions) { resolve(keysOrIds.map(koi => ({
            // Si la clave es un texto con solo números lo trataremos como un id numérico.
            idreg: typeof koi === 'number' || /^\d+$/.test(koi.toString()) ? +koi : undefined,
            key: typeof koi === 'string' && !(/^\d+$/.test(koi)) ? koi : undefined,
            blobVersion: undefined,
            userVersion: undefined,
          })));
        }
        // Resolvemos las versiones de los ids solicitados.
        const resumed: any[] = [];
        keysOrIds.map(koi => {
          if (typeof koi === 'string' && !(/^\d+$/.test(koi))) {
            const version = versions.find((v: UserSettings) => v.key === koi);
            resumed.push(version || { idreg: undefined, key: koi, blobVersion: undefined, userVersion: undefined });

          } else {
            const version = versions.find((v: UserSettings) => +v.idreg === +koi);
            resumed.push(version || { idreg: +koi, key: undefined, blobVersion: undefined, userVersion: undefined });
          }
        });
        resolve(resumed);

      }).catch(error => reject(error));
    });
  }

  /** Devuelve el parámetro para solicitar los ajustes de usuario indicados. */
  param(versions: UserSettings[]): string {
    if (!versions) { return ''; }
    return versions.map(v => (v.idreg ? `${v.idreg}` : encodeURIComponent(v.key)) + (v.blobVersion ? `:${v.blobVersion}` : '') + (v.userVersion ? `:${v.userVersion}` : '')).join(',');
  }

  /** Actualiza en el storage las versiones y los ajustes de usuario recuperados. */
  store(settings: UserSettings[]): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (settings && settings.length) {
        this.versions().then((versions: UserSettings[]) => {
          if (!versions) { versions = []; }
          const promises: Promise<any>[] = [];
          settings.map((us: UserSettings) => {
            const version = versions.find((v: UserSettings) => +v.idreg === +us.idreg);
            // Actualizamos o añadimos la versión.
            if (version) {
              version.blobVersion = us.blobVersion;
              version.userVersion = us.userVersion;
            } else {
              versions.push({ idreg: us.idreg, key: us.key, blobVersion: us.blobVersion, userVersion: us.userVersion } );
            }
            // Actualizamos el ajuste de usuario en el storage.
            promises.push(this.set(us));
          });
          // Actualizamos las versiones en el storage.
          promises.push(this.versions(versions));
          // Resolvemos todas las promesas pendientes.
          forkJoin(promises).pipe(first()).subscribe(() => resolve(), error => reject(error));

        }).catch(error => reject(error));
      }
      resolve();
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  storage
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene o establece las versiones actuales de los ajustes de usuario. */
  protected versions(settings?: UserSettings[]): Promise<UserSettings[]> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (!settings) {
        // get
        this.storage.get(this.prefix('versions')).then((versions: UserSettings[]) => resolve(versions)).catch(error => reject(error));

      } else {
        // set
        this.versions().then((versions: UserSettings[]) => {
          if (!versions) { versions = []; }
          settings.map((us: UserSettings) => {
            const version = versions.find((v: UserSettings) => v.idreg === us.idreg);
            if (version) {
              // update
              version.blobVersion = us.blobVersion;
              version.userVersion = us.userVersion;

            } else {
              // add
              versions.push({ idreg: us.idreg, key: us.key, blobVersion: us.blobVersion, userVersion: us.userVersion } );
            }
          });
          this.storage.set(this.prefix('versions'), versions).then(() => resolve(versions)).catch(error => reject(error));
        });
      }
    });
  }

  /** Obtiene un ajuste de usuario del sotrage a partir de su clave o su identificador. */
  get(keyOrId: string | number): Promise<UserSettings> {
    return new Promise<UserSettings>((resolve: any, reject: any) => {
      this.resolveKey(keyOrId).then((key: string) => {
        if (!key) { resolve(undefined); }
        this.storage.get(this.prefix(key)).then((us: UserSettings) => resolve(us || undefined)).catch(error => reject(error));

      }).catch(error => reject(error));
    });
  }

  /** Almacena un ajuste de usuario en el sotrage. */
  set(us: UserSettings): Promise<any> {
    return this.storage.set(this.prefix(us.key), us.value);
  }

  /** Elimina las versiones del storage. */
  clear(): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.versions().then((versions: UserSettings[]) => {
        const promises: Promise<any>[] = [];
        if (versions && versions.length) {
          versions.map((v: UserSettings) => promises.push(this.storage.remove(this.prefix(v.key))));
        }
        promises.push(this.storage.remove(this.prefix('versions')));
        forkJoin(promises).pipe(first()).subscribe(() => resolve(), error => reject(error));
      });
    });
  }

  /** Obtiene la clave del ajuste de usuario a partir de su clave o su identificador. */
  protected resolveKey(keyOrId: string | number): Promise<string> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (!keyOrId) { resolve(undefined); }
      // Si la clave es un texto con solo números lo trataremos como un id numérico.
      if (typeof keyOrId === 'string' && !(/^\d+$/.test(keyOrId))) {
        resolve(keyOrId);

      } else {
        // Buscamos la clave examinando las versiones.
        this.versions().then((versions: UserSettings[]) => {
          if (!versions) { resolve(undefined); }
          const version = versions.find((v: UserSettings) => +v.idreg === +keyOrId);
          resolve(version ? version.key : undefined);

        }).catch(error => reject(error));
      }
    });
  }

  /** Devuelve la clave del storage con el prefijo `userSettings_`. */
  protected prefix(key: string): string {
    return `userSettings_${key}`;
  }

}
