import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Plugins, DeviceInfo, DeviceBatteryInfo, DeviceLanguageCodeResult, OperatingSystem } from '@capacitor/core';
import { ElectronService } from 'ngx-electron';

import { AppConfig } from 'src/core/app-config';


const { Device } = Plugins;

/**
 * Wrapper para combinar plugins `Device` y `Platform` de `Cordova` o `Capacitor`.
 *
 * **Cordova**
 *
 * - Docs: {@link https://ionicframework.com/docs/native/device}
 * - Repo: {@link https://github.com/apache/cordova-plugin-device}
 *
 * ```bash
 * ionic cordova plugin add cordova-plugin-device
 * npm install @ionic-native/device --save
 * ```
 * ```typescript
 * import { Device } from '@ionic-native/device/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/device}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { Device } = Plugins;
 *
 * const info = await Device.getInfo();
 * ```
 *
 * Exemples de respostes:
 * ```ts
 * // Browser emulating iPhone 6
 * const deviceInfo = {
 *   appBuild: "",
 *   appVersion: "",
 *   isVirtual: false,
 *   manufacturer: "Google Inc.",
 *   model: "iPhone",
 *   operatingSystem: "ios",
 *   osVersion: "13.2.3",
 *   platform: "web",
 *   uuid: "0ac23490-e96d-4c7c-9b92-394af3a2dbeb",
 * };
 *
 * // iPhone 6
 * const deviceInfo = {
 *   "appVersion": "1.0.2",
 *   "appBuild": "123",
 *   "diskFree": 12228108288,
 *   "diskTotal": 499054952448,
 *   "isVirtual":true,
 *   "manufacturer": "Apple",
 *   "memUsed": 93851648,
 *   "model": "iPhone",
 *   "operatingSystem": "ios",
 *   "osVersion": "11.2",
 *   "platform": "ios",
 *   "uuid": "84AE7AA1-7000-4696-8A74-4FD588A4A5C7",
 * };
 *
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class DevicePlugin {
  protected debug = true && AppConfig.debugEnabled;

  info: DeviceInfo;

  constructor(
    public plt: Platform,
    public electronService: ElectronService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.plt.ready().then(() => {
      this.getInfo().then(info => {
        this.info = info;
      });
    });
  }

  // ---------------------------------------------------------------------------------------------------
  //  Plugin wrapper
  // ---------------------------------------------------------------------------------------------------

  /** Devuelve la info del dispositivo para usar como parámetros de una llamada `HttpRequest`. */
  getInfo(): Promise<DeviceInfo> {
    return Device.getInfo();
  }

  /** Return information about the battery. */
  getBatteryInfo(): Promise<DeviceBatteryInfo> {
    return Device.getBatteryInfo();
  }

  /** Get the device's current language locale code. */
  getLanguageCode(): Promise<DeviceLanguageCodeResult> {
    return Device.getLanguageCode();
  }

  // ---------------------------------------------------------------------------------------------------
  //  Additional functionality
  // ---------------------------------------------------------------------------------------------------

  /**
   * Returns a promise when the platform is ready and native functionality can be called.
   * If the app is running from within a web browser, then the promise will resolve when the DOM is ready.
   * When the app is running from an application engine such as Cordova, then the promise will resolve when Cordova triggers the deviceready event.
   *
   * **Native functionality available immediately**
   * When using Cordova, you need to wait until the device is ready before making calls to native functionality (e.g. by using platform.ready()).
   * Capacitor will export JavaScript on app boot so that this is no longer required.
   */
  ready(): Promise<DeviceInfo> {
    return new Promise<DeviceInfo>((resolve: any, reject: any) => {
      this.plt.ready().then(() => {
        // Devolvemos la info del dispositivo.
        if (this.info) { resolve(this.info); }
        this.getInfo().then(info => {
          this.info = info;
          resolve(info);
        }).catch(error => reject(error));
      }).catch(error => reject(error));
    });
  }

  /** Comprueba la plataforma del dispositivo. */
  is(platform: DeviceInfo['platform']): boolean {
    return this.info?.platform === platform;
    // return platform === 'electron' && this.electronService.isElectronApp || this.info.platform === platform;
  }

  /** Comprueba si el dispositivo es de la plataforma indicada y además no es virtual. */
  isReal(platform: DeviceInfo['platform']): boolean {
    return !this.isVirtual && this.is(platform);
  }

  /** Obtiene la plataforma del dispositivo. */
  get platform(): DeviceInfo['platform'] { return this.electronService.isElectronApp ? 'electron' : this.info?.platform; }
  /** Devuelve el sistema operativo del dispositivo. */
  get operatingSystem(): OperatingSystem { return this.info?.operatingSystem; }
  /** Indica si el dispositivo está virtualizado. */
  get isVirtual(): boolean { return this.info?.isVirtual; }
  /** Indica si el dispositivo es un teléfono `ios` o `android` no virtualizado. */
  get isRealPhone(): boolean { return !this.isVirtual && (this.info?.platform === 'ios' || this.info?.platform === 'android'); }
  /** Devuelve la versión de la aplicación. */
  get appBuild(): string { return this.info?.appBuild; }
  /** Devuelve la Id de la aplicación. */
  get appId(): string { return this.info?.appId; }

}
