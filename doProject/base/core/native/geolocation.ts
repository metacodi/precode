import { Injectable, OnDestroy } from '@angular/core';
import { Plugins, GeolocationOptions, GeolocationPosition, GeolocationWatchCallback } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';


const { Geolocation } = Plugins;

/**
 * Wrapper para el plugin `Geolocation`.
 *
 *
 * **Cordova**
 *
 * - Docs: {@link https://ionicframework.com/docs/native/geolocation}
 * - Repo: {@link https://github.com/apache/cordova-plugin-geolocation}
 *
 * ```bash
 * ionic cordova plugin add cordova-plugin-geolocation
 * npm install @ionic-native/geolocation
 * ```
 * ```typescript
 * import { Geolocation } from '@ionic-native/geolocation/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/geolocation}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { Geolocation } = Plugins;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class GeolocationPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor() {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  /** Get the current GPS location of the device. */
  getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
    return Geolocation.getCurrentPosition(options);
  }

  /** Get the current GPS location of the device. */
  watchPosition(options: GeolocationOptions, callback: GeolocationWatchCallback): string {
    return Geolocation.watchPosition(options, callback);
  }

  /** Clear a given watch. */
  clearWatch(options: { id: string }): Promise<void> {
    return Geolocation.clearWatch(options);
  }


}
