import { Injectable, OnDestroy } from '@angular/core';
import { Plugins, PluginResultError } from '@capacitor/core';
import { Subject, of } from 'rxjs';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';

const { FaceId } = Plugins;

export type FaceIdResponse = 'TouchId' | 'FaceId' | 'None';

/**
 * Wrapper para el plugin `FaceId`.
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

  constructor(
    public device: DevicePlugin
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Checks if Face ID or Touch ID is available, and returns type if so. */
  isAvailable(): Promise<{ value: FaceIdResponse }> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return FaceId.isAvailable(); }
    });
    
  }

  /** Displays the Face ID or Touch ID screen. */
  auth(options?: {reason?: string}): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return FaceId.auth(options); }
    });
  }

}
