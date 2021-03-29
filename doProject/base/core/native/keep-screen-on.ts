import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { of } from 'rxjs';
import { SetResult } from 'capacitor-keep-screen-on';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';

const { CapacitorKeepScreenOn } = Plugins;

/**
 * Wrapper para el plugin `CapacitorKeepScreenOn`.
 *
 * **Capacitor Community**
 *
 * - Api: {@link https://github.com/go-u/capacitor-keep-screen-on/tree/master/docs/en}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { CapacitorKeepScreenOn } = Plugins;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CapacitorKeepScreenOnPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(public device: DevicePlugin) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  /** Enable keep screen on. */
  enable(): Promise<SetResult> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return CapacitorKeepScreenOn.enable(); }
    });
  }

  /** Disable keep screen on. */
  disable(): Promise<SetResult> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return CapacitorKeepScreenOn.disable(); }
    });
  }

  /** Gets current state. */
  getState(): Promise<SetResult> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return CapacitorKeepScreenOn.getState(); }
    });
  }

}
