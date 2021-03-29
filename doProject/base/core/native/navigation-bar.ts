import { Injectable } from '@angular/core'
  ;
import { Platform } from '@ionic/angular';
import { NavigationBar } from '@ionic-native/navigation-bar/ngx';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';


/**
 * Wrapper para el plugin `NavigationBar`. AutoHide NavigationBar and StatusBar is a fullScreen Mode Android
 *
 * **Cordova**
 * 
 * npm install cordova-plugin-navigationbar
 * npm install @ionic-native/navigation-bar
 * ionic cap sync
 *
 * ```typescript
 * import { NavigationBar } from '@ionic-native/navigation-bar/ngx';
 * ```
 *
 * Add on app.modules.ts
 * 
 * import { NavigationBar } from '@ionic-native/navigation-bar/ngx';
 * 
 * providers: [
 *   NavigationBar,
 * ],
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationBarPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public plt: Platform,
    public device: DevicePlugin,
    public navigationBar: NavigationBar,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.plt.ready().then(() => {
      this.device.getInfo().then(value => {
        if (this.device.isRealPhone && this.device.is('android')) {
          let autoHide: boolean = true;
          this.navigationBar.setUp(autoHide);
        }
      });
    });

  }

  


}
