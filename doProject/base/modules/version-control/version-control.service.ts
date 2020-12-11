import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OperatingSystem } from '@capacitor/core';
import { ElectronService } from 'ngx-electron';

import { AppConfig } from 'src/config';
import { AbstractBaseClass } from 'src/core/abstract';
import { ApiService } from 'src/core/api';
import { AuthService, AuthenticationState } from 'src/core/auth';
import { DevicePlugin } from 'src/core/native';


/** Checks the version of the application. If a new version exists in the store, navigates to the version control page. */
@Injectable({
  providedIn: 'root'
})
export class VersionControlService extends AbstractBaseClass implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /** Current version of the app */
  current: string;
  /** Future version available on play store */
  future: string;
  /** App url winthin play store */
  urlStore: string;

  isVersionChecked = false;

  downloading = false;

  times = 5;

  /** @hidden */
  authenticationChangedSubscription: Subscription;

  constructor(
    public injector: Injector,
    public api: ApiService,
    // public storage: StoragePlugin,
    public device: DevicePlugin,
    public auth: AuthService,
    public router: Router,
    public electronService: ElectronService,

  ) {
    super(injector);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.check();

    this.authenticationChangedSubscription = this.auth.authenticationChanged.subscribe((state: AuthenticationState) => {
      // Comprobamos la versión ahora por si el usuario no cierra nunca la app.
      if (state.isAuthenticated) { this.reCheck(state.user.AppVersion); }
    });
  }

  ngOnDestroy() {
    if (this.authenticationChangedSubscription) { this.authenticationChangedSubscription.unsubscribe(); }
  }


  /** Comprueba la versión de la aplicación. */
  check() {
    if (!AppConfig.versionControl.allowCheckVersion) { return; }
    if (this.debug) { console.log(this.constructor.name + '.check()'); }
    // {"name": "iPhone 6s Plus", "uuid": "C963FFF7-ECAB-48F5-B376-2CB5CC7DCB01", "appId": "com.exceltaxisantcugat.user", "model": "iPhone", "appName": "Excel Taxi", "memUsed": 101859328, "appBuild": "1", "diskFree": 2783154176, "platform": "ios", "diskTotal": 15978983424, "isVirtual": false, "osVersion": "14.0.1", "appVersion": "1.0", "manufacturer": "Apple", "operatingSystem": "ios"}
    this.device.ready().then(info => {
      const packageName = info.appId;
      this.current = info.appVersion;


      if (info.platform === 'web') { return true; }
      // Comprobamos si existe una nueva versión para descargar del Store.
      const platform = this.device.operatingSystem;
      // const platform = 'android';
      if (!this.isVersionChecked) {
        // Obtenemos las versiones disponibles para la plataforma.
        this.availableVersions(platform, packageName).subscribe(data => {
          if (this.debug) { console.log(this.constructor.name + '.availableVersions() => ', data); }
          // Solo se obtiene respuesta para: 'ios' | 'android'.
          if (data) {

            this.urlStore = data.url;

            // Comprobamos si hay una versión mayor en la tienda.
            if (this.compareVersions(this.current, data.version)) {
              // Recordamos la nueva versión la tienda.
              this.future = data.version;
              // Obtenemos la url de la app en la tienda.
              this.urlStore = data.url;

              // Navegamos hacia la pantalla de control de versión.
              this.router.navigate(['/version-control']);

            } else {
              // No hay cambios de versión. Establecemos el indicador de estado.
              this.isVersionChecked = true;
              if (this.debug) { console.log(this.constructor.name + '.check() -> version = ', this.current); }
            }
          }
        });
      }
    });
  }

  /** Comprueba la versión que nos llega del login. */
  reCheck(data: any) {
    if (AppConfig.versionControl.allowCheckVersion) {
      // Comprobamos la versión que nos ha llegado del login o refreshToken.
      if (this.compareVersions(this.current, data.version)) {
        // Navegamos hacia la pantalla de control de versión.
        this.router.navigate(['/version-control']);
      }
    }
  }

  /** Compara las numeraciones de las versiones. Devuelve true si max > min, false en cualquier otro caso. */
  compareVersions(min: string, max: string) {
    if (!min || !max) { return false; }
    // Obtenemos uin array con los niveles de la versión.
    const mins = min.split('.');
    const maxs = max.split('.');
    // Comparamos valor a valor hasta la menor profundidad disponible.
    for (let i = 0; i < Math.min(mins.length, maxs.length); i++) {
      const v1 = +mins[i];
      const v2 = +maxs[i];
      if (v1 > v2) { return false; }
      if (v1 < v2) { return true; }
    }
    // Llegados hasta el menor nivel de profundidad las dos versiones coinciden. Comprobamos la profundidad de las versiones.
    if (mins.length < maxs.length) { return true; }
    // Los dos números son iguales o min tiene mayor profundidad.
    return false;
  }

  /** Devuelve la versión de la aplicación en la tienda para la plataforma indicada. */
  availableVersions(platform: OperatingSystem, appId: string): Observable<any> {
    if (platform === 'unknown') { return of<any>(undefined); }
    return this.api.get(`checkAppVersion?id=${appId}&platform=${platform}`).pipe(catchError(error => this.alertError({ error })));
  }

  downloadVersion() {
    // const req = this.electronService.remote.;
    // req.arguments = {
    //   method: 'GET',
    //   uri: 'https://taxi.metacodi.com/pre/downloads/ExcelTaxi-3.0.0.dmg'
    // };

    // const out = this.electronService.fs.createWriteStream('/Users/xaviergiral/Documents/ExcelTaxi.dmg');

    // const stream = this.electronService.fs.createReadStream('https://taxi.metacodi.com/pre/downloads/ExcelTaxi-3.0.0.dmg');
    // this.electronService.fs.createWriteStream('/Users/xaviergiral/Documents/ExcelTaxi.dmg');


    // this.electronService.ipcRenderer.send('download', {
    //   url: 'https://taxi.metacodi.com/pre/downloads/ExcelTaxi-3.0.0.dmg',
    //   properties: { directory: '/Users/xaviergiral/Documents/ExcelTaxi-3.0.0.dmg' }
    // });

    // this.electronService.ipcRenderer.on("download complete", (event, file) => {
    //   console.log(file); // Full file path
    // });

    this.downloading = true;
    if (this.debug) { console.log(this.constructor.name + '.downloadVersion url:', this.urlStore); }
    this.electronService.ipcRenderer.invoke('downloadApp', this.urlStore).then((result) => {
      console.log(result);
    });
    // ipc.send('synMessage', 'hey' , (event, messages) => {
    //   // do something
    //   console.log('Angular => ', messages);
    // });

    // this.electronService.shell.openItem('/Users/xaviergiral/Downloads/ExcelTaxi-3.0.0.dmg'); //Ok funciona

    // this.electronService.shell.showItemInFolder('/Users/xaviergiral/Downloads/ExcelTaxi-3.0.0.dmg'); //Ok funciona

    // this.electronService.shell.openPath('/Users/xaviergiral/Downloads'); //Ok funciona

    // this.electronService.shell.openExternal('https://taxi.metacodi.com/pre/downloads/ExcelTaxi-3.0.0.dmg', { }); // Obre un navegador i descarrega l'arxiu.

  }

  appQuit(){
    this.electronService.ipcRenderer.invoke('appQuit', this.urlStore).then((result) => {
      console.log(result);
    });
  }

  async echoElectron() {
    this.electronService.shell.openPath('/Users/xaviergiral/Downloads');
    // this.electronService.shell.showItemInFolder('/Users/xaviergiral/Documents/ExcelTaxi-3.0.0.dmg');
    if (this.debug) { console.log(this.constructor.name + 'electronService isElectron => ', this.electronService.isElectronApp); }
  }


}
