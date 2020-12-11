import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';


const { SplashScreen } = Plugins;

/**
 * Wrapper para el plugin `SplashScreen`.
 *
 * **Cordova**
 *
 * ```typescript
 * import { SplashScreen } from '@ionic-native/splash-screen/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/splash-screen}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { SplashScreen } = Plugins;
 *
 * SplashScreen.show();
 * SplashScreen.hide();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SplashScreenPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }


  /** Show the splash screen. */
  async show(): Promise<void> {
    return this.device.ready().then(() => {
      if (this.device.isRealPhone) {
        return SplashScreen.show();
      } else {
        return;
      }
    });
  }

  /** Hide the splash screen. */
  async hide(): Promise<void> {
    return this.device.ready().then(() => {
      if (this.device.isRealPhone) {
        return SplashScreen.hide();
      } else {
        return;
      }
    });
  }

}
