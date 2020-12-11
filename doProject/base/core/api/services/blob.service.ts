import { Injectable, OnDestroy } from '@angular/core';
import { forkJoin, Observable, Subject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

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
  updated: Subject<Blob> = new Subject();

  updateSubscriptions: Subscription[] = [];

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
   * this.blobs.get('mapsSettings').subscribe(blob => this.config = blob);
   * ```
   */
  get(key: string): Observable<any> {
    return new Observable<any>(observer => {
      // Obtenemos el valor actual del storage.
      this.read(key).then(value => observer.next(value));
      // Nos suscribimos al notificador de actualizaciones para su renvío.
      const subscription = this.updated.subscribe(blob => {
        if (blob.key === key) { observer.next(blob.value); }
      });
      // Almacenamos el subscriptor para terminar la suscripción durante la destrucción del servicio.
      this.updateSubscriptions.push(subscription);
    });
  }

  ngOnDestroy() {
    if (this.updated) { this.updated.complete(); }
    if (this.updateSubscriptions?.length) { this.updateSubscriptions.map(sub => sub.unsubscribe()); }
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
          forkJoin(promises).pipe(first()).subscribe(() => resolve(), error => reject(error));

        }).catch(error => reject(error));
      }
      resolve();
    });
  }

  // ---------------------------------------------------------------------------------------------------
  //  storage
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene o establece las versiones actuales de los blobs. */
  protected versions(blobs?: Blob[]): Promise<Blob[]> {
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
        if (versions && versions.length) {
          versions.map((v: Blob) => promises.push(this.storage.remove(this.prefix(v.key))));
        }
        promises.push(this.storage.remove(this.prefix('versions')));
        forkJoin(promises).pipe(first()).subscribe(() => resolve(), error => reject(error));
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
