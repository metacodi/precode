import { Injectable, Injector, OnDestroy } from '@angular/core';
import { from, of, Subscription, Subscriber } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator/ngx';

import { AppConfig } from 'src/config';
import { AbstractBaseClass } from 'src/core/abstract';
import { BlobService } from 'src/core/api';
import { DevicePlugin, StoragePlugin } from 'src/core/native';


/** Checks the version of the application. If a new version exists in the store, navigates to the version control page. */
@Injectable({
  providedIn: 'root'
})
export class LaunchNavigatorService extends AbstractBaseClass {
  protected debug = true && AppConfig.debugEnabled;

  /** Devuelve una lista que indica qué aplicaciones están instaladas y disponibles en el dispositivo actual y además permitidas por nosotros. */
  availableApps = [];

  /** La aplicación actualmente seleccionada o usada por última vez (storage). */
  protected currentApp = undefined;
  /** Clave en el storage. */
  protected navigationAppStorageKey = 'navigationApp';

  constructor(
    public injector: Injector,
    public device: DevicePlugin,
    public translate: TranslateService,
    public launchNavigator: LaunchNavigator,
    public storage: StoragePlugin,
    public blob: BlobService,
  ) {
    super(injector);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    this.storage.get(this.navigationAppStorageKey).then(appNavigation => this.currentApp = appNavigation);

    this.blob.get('mapsSettings').then(behavior => behavior.subscribe(data => this.filterAvailableApps(data.navigationApps?.available)));

  }


  /**
   * Abre una app del dispositivo para la navegación
   *
   * Una {cadena} que contiene la dirección. p.ej.
   * ```typescript
   * this.launchNavigator.openApp('Vallcoraba 7, 08208 Sabadell', 'Carrer de Muntaner 12, 08011 Barcelona');
   * ```
   *
   * Una {cadena} que contiene una coordenada de latitud / longitud. p.ej.
   * ```typescript
   * this.launchNavigator.openApp('41.5569567 2.1026032', 'Carrer de Muntaner 12, 08011 Barcelona');
   * ```
   *
   * // Una {matriz}, donde el primer elemento es la latitud y el segundo elemento es una longitud, como números decimales. p.ej.
   * ```typescript
   * this.launchNavigator.openApp([41.5569567,2.1026032], 'Carrer de Muntaner 12, 08011 Barcelona');
   * ```
   */
  async openApp(ruta: { destino: string | number[], recogida?: string | number[] }): Promise<any> {
    return this.device.getInfo().then(value => {
      if (this.device.isRealPhone) {
        const options: LaunchNavigatorOptions = {
          start: ruta.recogida,
          appSelection: {
            dialogHeaderText: this.translate.instant('launchNavigator.selecione_app'),
            cancelButtonText: this.translate.instant('buttons.cancel'),
            list: this.currentApp !== undefined && this.launchNavigator.isAppAvailable(this.currentApp) ? [this.currentApp] : this.availableApps,
            callback: (app) => this.alertEstablecerApp(app),
            rememberChoice: {
              enabled: false,
            }
          }
        };

        return this.launchNavigator.navigate(ruta.destino, options)
          .then(
            success => { console.log('Launched navigator'); return success; },
            error => console.log('Error launching navigator', error)
          );

      } else {
        return of().toPromise();
      }
    });
  }

  /**
   * Libera una app de navegación por defecto
   * ```typescript
   * this.launchNavigator.clearAppDefault();
   * ```
   */
  clearAppDefault(): Promise<any> {
    return this.storage.set(this.navigationAppStorageKey, undefined);
  }

  /**
   * Establece o Libera una app de navegación por defecto
   * ```typescript
   * this.launchNavigator.setCurrentApp(app);
   * ```
   */
  setCurrentApp(app: string): Promise<any> {
    this.currentApp = this.isSelected(app) ? undefined : app;
    return this.storage.set(this.navigationAppStorageKey, this.currentApp);
  }


  // ---------------------------------------------------------------------------------------------------
  //  Funciones internas
  // ---------------------------------------------------------------------------------------------------

  /** Emite una alrta y establece una app por defecto */
  protected alertEstablecerApp(app: string) {
    this.showAlert({
      header: 'launchNavigator.quiere_usar_app_navegacion',
      message: 'launchNavigator.quiere_usar_app_navegacion_message',
      YesNo: true,
    }).then(response => {
      if (response) {
        this.currentApp = app;
        if (this.debug) { console.log(this.constructor.name + '.alertEstablecerApp -> showAlert app:', app); }
        this.storage.set(this.navigationAppStorageKey, app);
      }
    });
  }

  protected filterAvailableApps(navigationApps: string[]) {
    // { "google-maps": true, "waze": false }
    this.device.getInfo().then(value => {
      if (this.device.isRealPhone) {
        this.launchNavigator.availableApps().then(apps => {
          // Inicializamos la colección.
          this.availableApps = [];
          // Comprobamos que esté disponible en el dispositivo y también en la lista del blob de settings.
          Object.keys(apps).map(key => apps[key] && navigationApps.find(app => app === key) ? this.availableApps.push(key) : undefined);
          if (this.debug) { console.log(this.constructor.name + '.filterAvailableApps this.availableApps:', this.availableApps); }
        });
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Getters
  // ---------------------------------------------------------------------------------------------------

  /** Devuelve el nombre para mostrar de la aplicación especificada.
   * ```typescript
   * this.launchNavigator.getAppDisplayName(app);
   * ```
   */
  getAppDisplayName(app: string): string { return this.launchNavigator.getAppDisplayName(app); }

  /** Devuelve el si de la aplicación especificada esta establecida por defecto.
   * ```typescript
   * this.launchNavigator.isSelected(app);
   * ```
   */
  isSelected(app: string): boolean { return !!this.currentApp && this.currentApp === app; }

  /** Devuelve una lista de aplicaciones compatibles en una plataforma determinada.
   * ```typescript
   * this.launchNavigator.getAllApps();
   * ```
   */
  get getAllApps(): string[] { return this.launchNavigator.getAppsForPlatform(this.device.platform); }

}
