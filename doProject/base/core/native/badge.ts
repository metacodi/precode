import { Injectable } from '@angular/core';

import { Badge } from '@ionic-native/badge/ngx';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';


/**
 * Wrapper para el plugin `SplashScreen`.
 *
 * **Cordova**
 *
 * ```typescript
 * import { Badge } from '@ionic-native/badge/ngx';
 * ```
 *
 */
@Injectable({
  providedIn: 'root'
})
export class BadgePlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin,
    public badge: Badge,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }


  /** Set Badge. */
  async setBagde(badgeNumber): Promise<void> {
    return this.device.ready().then(() => {
      if (this.device.isRealPhone) {
        if (badgeNumber > 0){
          this.badge.set(badgeNumber);
        } else {
          this.badge.clear();
        }
        return;
      } else if (this.device.electronService.isElectronApp) {
        badgeNumber = badgeNumber === undefined || badgeNumber < 1 ? null : badgeNumber;
        if (this.device.electronService.isWindows) {
          this.device.electronService.ipcRenderer.invoke('update-badge', badgeNumber);
        } else {
          this.device.electronService.ipcRenderer.invoke('setBatge', badgeNumber);
        }
      } else  {
        return;
      }
    });
  }

}
