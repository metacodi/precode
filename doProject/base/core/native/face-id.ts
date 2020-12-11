import { Injectable, OnDestroy } from '@angular/core';
import { Plugins, PluginResultError } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';


const { FaceId } = Plugins;

export type FaceIdResponse = 'TouchId' | 'FaceId' | 'None';

/**
 * Wrapper para el plugin `FaceId`.
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
 * import { FaceId } from '@ionic-native/geolocation/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://github.com/danielsogl/capacitor-face-id}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { FaceId } = Plugins;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FaceIdPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor() {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Checks if Face ID or Touch ID is available, and returns type if so. */
  isAvailable(): Promise<{ value: FaceIdResponse }> {
    return FaceId.isAvailable();
  }

  /** Displays the Face ID or Touch ID screen. */
  auth(options?: {reason?: string}): Promise<void> {
    return FaceId.auth(options);
  }

}
