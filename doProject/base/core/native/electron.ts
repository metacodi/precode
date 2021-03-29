import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Plugins, DeviceInfo, DeviceBatteryInfo, DeviceLanguageCodeResult, OperatingSystem } from '@capacitor/core';
import { ElectronService } from 'ngx-electron';


import { AppConfig } from 'src/core/app-config';
import { TranslateService } from '@ngx-translate/core';


const { Device } = Plugins;

/**
 * Wrapper para combinar plugins `ElectronService`.
 *
 * **Capacitor**
 *
 * - Api: {@link https://github.com/ThorstenHans/ngx-electron}
 *
 * ```typescript
 * import { ElectronService } from 'ngx-electron';
 *
 * constructor(private _electronService: ElectronService) { }
 * 
 * const isElectronApp = this._electronService.isElectronApp;
 * ```
 *
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public plt: Platform,
    public electronService: ElectronService,
    public translate: TranslateService,
    public router: Router,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.plt.ready().then(() => {
      if (this.isElectronApp) {
        this.electronService.ipcRenderer.on('navigate', (event, arg) => {
          this.router.navigate([arg]);
        });
      }
    });
  }

  // ---------------------------------------------------------------------------------------------------
  //  Plugin wrapper
  // ---------------------------------------------------------------------------------------------------

  /** Establece el menú contextual. */
  invoke(channel: string, arg: any): Promise<void>{
    return this.plt.ready().then(() => {
      if (this.electronService.isElectronApp) {
        return this.electronService.ipcRenderer.invoke(channel, arg);
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Funciones Adicionales
  // ---------------------------------------------------------------------------------------------------

  /** Establece el menú contextual. */
  setMenuContext(labels: any) {
    this.plt.ready().then(() => {
      if (this.electronService.isElectronApp) {
        this.electronService.ipcRenderer.invoke('setContextMenu', { labels }).then(() => { });
      }
    }
    );
  }

  /** Establece el menú contextual. */
  setMenuApp(menu: any) {
    this.plt.ready().then(() => {
      if (this.electronService.isElectronApp) {
        const menu = {
          label: 'Inicio',
          submenu: [
            {
              label: 'Mi Perfil',
              navigate: '/mi-perfil'
            }
          ]
        }
        this.electronService.ipcRenderer.invoke('setMenuApp', { menu }).then(() => { });
      }
    }
    );
  }

  // /** Devuelve la info del dispositivo para usar como parámetros de una llamada `HttpRequest`. */
  // getInfo(): Promise<DeviceInfo> {
  //   return Device.getInfo();
  // }

  // /** Return information about the battery. */
  // getBatteryInfo(): Promise<DeviceBatteryInfo> {
  //   return Device.getBatteryInfo();
  // }

  // /** Get the device's current language locale code. */
  // getLanguageCode(): Promise<DeviceLanguageCodeResult> {
  //   return Device.getLanguageCode();
  // }


  /** Indica si la aplicación se está ejecutando dentro de electron o no. */
  get isElectronApp(): boolean { return this.electronService.isElectronApp; }
  // /** Devuelve el sistema operativo del dispositivo. */
  // get operatingSystem(): OperatingSystem { return this.info?.operatingSystem; }
  // /** Indica si el dispositivo está virtualizado. */
  // get isVirtual(): boolean { return this.info?.isVirtual; }
  // /** Indica si el dispositivo es un teléfono `ios` o `android` no virtualizado. */
  // get isRealPhone(): boolean { return !this.isVirtual && (this.info?.platform === 'ios' || this.info?.platform === 'android'); }
  // /** Devuelve la versión de la aplicación. */
  // get appBuild(): string { return this.info?.appBuild; }
  // /** Devuelve la Id de la aplicación. */
  // get appId(): string { return this.info?.appId; }

}
