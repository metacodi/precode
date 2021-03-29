import { Injectable, OnDestroy, Injector } from '@angular/core';
import { Observable, Subject, BehaviorSubject, Subscriber, Subscription, of } from 'rxjs';

import { AppConfig } from 'src/core/app-config';
import { StoragePlugin } from 'src/core/native';


export interface Blob {
  idreg: number;
  key: string;
  version: number;
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BlobService implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /**
   * Notifica los blobs recibidos desde ApiService.
   *
   * Esta opción se complementa con el uso de la función `get()` para mantener actualizados los blobs en todo momento.
   */
  updated = new Subject<Blob>();

  /** Coleccionamos los subjects para destinar uno para cada instancia diferente de settings. */
  subjects: { [key: string]: { subject: BehaviorSubject<any>, sub: Subscription } } = {};

  constructor(
    public storage: StoragePlugin,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  // ---------------------------------------------------------------------------------------------------
  //  get
  // ---------------------------------------------------------------------------------------------------

  /**
   * Obtiene el valor de un blob del storage y posteriormente de las actualizaciones notificadas a través de update.
   *
   * ```typescript
   * this.blobs.get('mapsSettings').then(behavior => behavior.subscribe(value => this.mapsSettings = value));
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
  //  request
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene las versiones de los blobs solicitados. */
  resume(keyOrId?: 'check' | 'force' | string | string[] | number | number[]): Promise<Blob[]> {
    return new Promise<any>((resolve: any, reject: any) => {
      // Obtenemos las versiones del storage.
      this.versions().then((versions: Blob[]) => {
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
            version: undefined,
          })));
        }
        // Resolvemos las versiones de los ids solicitados.
        const resumed: any[] = [];
        keysOrIds.map(koi => {
          if (typeof koi === 'string' && !(/^\d+$/.test(koi))) {
            const version = versions.find((v: Blob) => v.key === koi);
            resumed.push(version || { idreg: undefined, key: koi, version: undefined });

          } else {
            const version = versions.find((v: Blob) => +v.idreg === +koi);
            resumed.push(version || { idreg: +koi, key: undefined, version: undefined });
          }
        });
        resolve(resumed);

      }).catch(error => reject(error));
    });
  }

  /** Devuelve el parámetro para solicitar los blobs indicados. */
  param(versions: Blob[]): string {
    if (!versions) { return ''; }
    return versions.map(v => (v.idreg ? `${v.idreg}` : encodeURIComponent(v.key)) + (v.version ? `:${v.version}` : '')).join(',');
  }

  /** Actualiza en el storage las versiones y los blobs recuperados. */
  store(blobs: Blob[]): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (blobs && blobs.length) {
        this.versions().then((versions: Blob[]) => {
          if (!versions) { versions = []; }
          const promises: Promise<any>[] = [];
          blobs.map((b: Blob) => {
            const version = versions.find((v: Blob) => +v.idreg === +b.idreg);
            // Actualizamos o añadimos la versión.
            if (version) { version.version = b.version; } else { versions.push({ idreg: b.idreg, key: b.key, version: b.version } ); }
            // Actualizamos el blob en el storage.
            promises.push(this.write(b));
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

  /** Obtiene o establece las versiones actuales de los blobs. */
  versions(blobs?: Blob[]): Promise<Blob[]> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (!blobs) {
        // get
        this.storage.get(this.prefix('versions')).then((versions: Blob[]) => resolve(versions)).catch(error => reject(error));

      } else {
        // set
        this.versions().then((versions: Blob[]) => {
          if (!versions) { versions = []; }
          blobs.map((b: Blob) => {
            const version = versions.find((v: Blob) => v.idreg === b.idreg);
            if (version) {
              // update
              version.version = b.version;

            } else {
              // add
              versions.push({ idreg: b.idreg, key: b.key, version: b.version });
            }
          });
          this.storage.set(this.prefix('versions'), versions).then(() => resolve(versions)).catch(error => reject(error));
        });
      }
    });
  }

  /** Obtiene el valor de un blob del sotrage a partir de su clave o su identificador. */
  protected read(keyOrId: string | number): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.resolveKey(keyOrId).then((key: string) => {
        if (!key) { resolve(undefined); }
        this.storage.get(this.prefix(key)).then((blob: any) => resolve(blob || undefined)).catch(error => reject(error));

      }).catch(error => reject(error));
    });
  }

  /** Almacena un blob en el sotrage. */
  protected write(blob: Blob): Promise<any> {
    return this.storage.set(this.prefix(blob.key), blob.value);
  }

  /** Elimina las versiones del storage. */
  protected clear(): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      this.versions().then((versions: Blob[]) => {
        const promises: Promise<any>[] = [];
        if (versions?.length) {
          versions.map((b: Blob) => promises.push(this.storage.remove(this.prefix(b.key))));
        }
        promises.push(this.storage.remove(this.prefix('versions')));
        Promise.all(promises).then(() => resolve(), error => reject(error));
      });
    });
  }

  /** Obtiene la clave del blob a partir de su clave o su identificador. */
  protected resolveKey(keyOrId: string | number): Promise<string> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (!keyOrId) { resolve(undefined); }
      // Si la clave es un texto con solo números lo trataremos como un id numérico.
      if (typeof keyOrId === 'string' && !(/^\d+$/.test(keyOrId))) {
        resolve(keyOrId);

      } else {
        // Buscamos la clave examinando las versiones.
        this.versions().then((versions: Blob[]) => {
          if (!versions) { resolve(undefined); }
          const version = versions.find((v: Blob) => +v.idreg === +keyOrId);
          resolve(version ? version.key : undefined);

        }).catch(error => reject(error));
      }
    });
  }

  /** Devuelve la clave del storage con el prefijo `blob_`. */
  protected prefix(key: string): string {
    return `blob_${key}`;
  }

}
