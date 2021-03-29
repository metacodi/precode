import { Injectable, OnDestroy, Injector } from '@angular/core';
import { Observable, Subject, Subscriber, Subscription, using, BehaviorSubject, of } from 'rxjs';

import { AppConfig } from 'src/core/app-config';
import { StoragePlugin } from 'src/core/native';
import { deepAssign } from 'src/core/util';

import { BlobService } from './blob.service';


export interface UserSettings {
  idreg?: number;
  key: string;
  blobVersion?: number;
  userVersion?: number;
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /**
   * Notifica los settings recibidos desde ApiService.
   *
   * Esta opción se complementa con el uso de la función `get()` para mantener actualizados los settings en todo momento.
   */
  updated = new Subject<UserSettings>();

  /** Coleccionamos los subjects para destinar uno para cada instancia diferente de settings. */
  subjects: { [key: string]: { subject: BehaviorSubject<any>, sub: Subscription } } = {};

  constructor(
    public storage: StoragePlugin,
    public blob: BlobService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  get
  // ---------------------------------------------------------------------------------------------------

  /**
   * Obtiene el valor de una configuración de usuario del storage y posteriormente de las actualizaciones notificadas a través de update.
   *
   * ```typescript
   * this.userSettings.get('facturasListSettings').then(behavior => behavior.subscribe(settings => this.facturasListSettings = settings));
   * ```
   */
  async get(key: string): Promise<BehaviorSubject<any>> {
    // Buscamos si existe un observable para la clave indicada.
    if (this.subjects[key]) {
      if (this.debug) { console.log(this.constructor.name + `.get('${key}') existing => `, this.subjects[key]); }
      return of(this.subjects[key].subject).toPromise();

    } else {
      // Obtenemos el valor actual del storage.
      return this.read(key).then(value => {
        const subject = new BehaviorSubject<any>(value);
        (subject as any).key = key;
        // Nos suscribimos al notificador de actualizaciones para su renvío.
        const sub = this.updated.subscribe(blob => { if (blob.key === key) { subject.next(blob.value); } });
        // Almacenamos el subject.
        this.subjects[key] = { subject, sub };
        if (this.debug) { console.log(this.constructor.name + `.get('${key}') NEW! => `, this.subjects[key]); }
        return subject;
      });
    }
  }

  ngOnDestroy() {
    if (this.updated) { this.updated.complete(); }
    Object.keys(this.subjects).map(key => {
      this.subjects[key].sub.unsubscribe();
      this.subjects[key].subject.complete();
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  set
  // ---------------------------------------------------------------------------------------------------

  /** Almacena un ajuste de usuario en el sotrage. */
  async set(key: string, value: any): Promise<void> {
    // Obtenemos las versiones del storage.
    return this.versions().then(versions => {
      if (!versions) {
        // NOTA: Esta opción es temporal, hasta que se haya implementado una gestión de los blobs
        // de usuario desde backend no dispondremos de los versiones de userSettings.
        this.blob.versions().then(blobVersions => {
          const blob = blobVersions?.find(v => v.key === key);
          if (blob) {
            const us: UserSettings = {
              idreg: blob.idreg,
              blobVersion: blob.version,
              userVersion: 1,
              key,
              value,
            };
            return this.store([us]);
          } else {
            throw new Error(`No se ha encontrado la versión del blob '${key}' para userSettings.`);
          }
        });
      } else {
        const version = versions.find(v => v.key === key);
        if (version) {
          version.value = value;
          version.userVersion += 1;
          return this.store([version]);
        }
      }
    });
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

  /** Actualiza en el storage las versiones y los ajustes de usuario. */
  store(settings: UserSettings[]): Promise<void> {
    return new Promise<void>((resolve: any, reject: any) => {
      if (settings?.length) {
        this.versions().then(versions => {
          if (!versions) { versions = []; }
          const promises: Promise<any>[] = [];
          settings.map(us => {
            // Actualizamos o añadimos la versión.
            const version = versions.find(v => +v.idreg === +us.idreg);
            if (version) {
              version.blobVersion = us.blobVersion;
              version.userVersion = us.userVersion;
            } else {
              versions.push({ idreg: us.idreg, key: us.key, blobVersion: us.blobVersion, userVersion: us.userVersion } );
            }
            // Actualizamos el ajuste de usuario en el storage.
            promises.push(this.write(us));
          });
          // Actualizamos las versiones en el storage.
          promises.push(this.versions(versions));
          // Resolvemos todas las promesas pendientes.
          Promise.all(promises).then(() => resolve(), error => reject(error));

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
            const found = versions.find((v: UserSettings) => v.idreg === us.idreg);
            if (found) {
              // update
              found.blobVersion = us.blobVersion;
              found.userVersion = us.userVersion;

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

  /** Obtiene el valor de un blob del sotrage a partir de su clave o su identificador. */
  protected read(keyOrId: string | number): Promise<UserSettings> {
    return new Promise<UserSettings>((resolve: any, reject: any) => {
      this.resolveKey(keyOrId).then((key: string) => {
        if (!key) { resolve(); }
        this.storage.get(this.prefix(key)).then((us: UserSettings) => resolve(us)).catch(error => reject(error));

      }).catch(error => reject(error));
    });
  }

  /** Almacena un blob en el sotrage. */
  protected write(us: UserSettings): Promise<any> {
    return this.storage.set(this.prefix(us.key), us.value);
  }

  /** Elimina las versiones del storage. */
  protected clear(): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.versions().then((versions: UserSettings[]) => {
        const promises: Promise<any>[] = [];
        if (versions && versions.length) {
          versions.map((us: UserSettings) => promises.push(this.storage.remove(this.prefix(us.key))));
        }
        promises.push(this.storage.remove(this.prefix('versions')));
        Promise.all(promises).then(() => resolve(), error => reject(error));
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
