import { Injectable, OnDestroy } from '@angular/core';
import { Plugins, NetworkStatus, PluginListenerHandle } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';


const { Network } = Plugins;

/**
 * Wrapper para el plugin `Network`.
 *
 * **Cordova**
 *
 * - Docs: {@link https://ionicframework.com/docs/native/network}
 * - Repo: {@link https://github.com/apache/cordova-plugin-network-information}
 *
 * ```bash
 * ionic cordova plugin add cordova-plugin-network-information
 * npm install @ionic-native/network --save
 * ```
 * ```typescript
 * import { Network } from '@ionic-native/network/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/network}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { Network } = Plugins;
 *
 * Network.show();
 * Network.hide();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkPlugin implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor() {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  ngOnDestroy(): void {
    Network.removeAllListeners();
  }

  /** iOS only. */
  addListenerNetworkStatusChange(callback: (status: NetworkStatus) => void): PluginListenerHandle {
    return Network.addListener('networkStatusChange', callback);
  }

  /** NetworkStatus. */
  getStatus(): Promise<NetworkStatus> {
    return Network.getStatus();
  }


}
