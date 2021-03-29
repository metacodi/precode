import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, MenuController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { KeyboardStyle } from '@capacitor/core';

// // Registramos los locales. Necesarios, por ejemplo, para el pipe 'currency'.
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
registerLocaleData(localeEn, 'en');
registerLocaleData(localeEs, 'es');
registerLocaleData(localeCa, 'ca');

import { AppConfig } from 'src/config';
import { AuthService } from 'src/core/auth';
import { ApiService, BlobService } from 'src/core/api';
import { DevicePlugin, KeyboardPlugin, StatusBarPlugin, LocalNotificationPlugin, ElectronPlugin } from 'src/core/native';
import { LocalizationService } from 'src/core/localization';
import { ThemeService, ThemeScheme } from 'src/core/util';

import { ALERTA_SERVICIO_CANCELADO, ALERTA_SERVICIO_RECHAZADO, ACCION_UPDATE_BLOBS } from 'src/app/model';


import { VersionControlService } from 'src/modules/version-control';

import { UserService } from 'src/app/user';
import { NotificationsService, NotifiedUser } from 'src/core/notifications';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  canSwipeServiciosMenu = true;
  canSwipeServicioMenu = true;

  // /** @hidden */
  // authenticationChangedSubscription: Subscription;

  /** @hidden */
  blobSubscription: Subscription;
  /** @hidden */
  executeNotificationSubscription: Subscription;

  constructor(
    public api: ApiService,
    public user: UserService,
    public platform: Platform,
    public statusBar: StatusBarPlugin,
    public keyboard: KeyboardPlugin,
    public auth: AuthService,
    public theme: ThemeService,
    public router: Router,
    public alert: AlertController,
    public menu: MenuController,
    public device: DevicePlugin,
    public lang: LocalizationService,

    public blob: BlobService,

    public localNotification: LocalNotificationPlugin,
    public versionControl: VersionControlService,
    public electron: ElectronPlugin,
    public loadingCtrl: LoadingController,
    public translate: TranslateService,
    public push: NotificationsService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.initializeApp();

    // Escuchamos las notificaciones push.
    this.executeNotificationSubscription = this.push.executeNotificationSubject.subscribe(nu => this.executeNotification(nu));
  }

  initializeApp() {
    // Establecemos la ruta de la api.
    ApiService.url = AppConfig.api.url;

    // Inicializamos los temas de la aplicación.
    this.theme.initialize(AppConfig.themes as ThemeScheme[]);

    // Inicializamos el color de fondo del teclado segun el tema.
    if (this.theme.current?.mode === 'dark') { this.keyboard.setStyle({ style: KeyboardStyle.Dark }); }


    // Add Google Maps script to <head>
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `${AppConfig.google.maps.url}?language=${AppConfig.google.maps.lang}&key=${AppConfig.google.maps.key}&libraries=geometry`;
    script.defer = true;
    document.head.appendChild(script);
    if (this.debug) { console.log(this.constructor.name + '.initializeApp() -> google maps script created!'); }

  }

  ngOnDestroy() {
    // if (this.authenticationChangedSubscription) { this.authenticationChangedSubscription.unsubscribe(); }
    if (this.blobSubscription) { this.blobSubscription.unsubscribe(); }
    if (this.executeNotificationSubscription) { this.executeNotificationSubscription.unsubscribe(); }
  }

  // ---------------------------------------------------------------------------------------------------
  //  notifications
  // ---------------------------------------------------------------------------------------------------

  executeNotification(nu: NotifiedUser): void {
    if (nu.notified.action === ACCION_UPDATE_BLOBS) { this.api.forceRequestBlobs(); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  menu
  // ---------------------------------------------------------------------------------------------------

  navigate(url: any[]) {
    this.menu.close().then(() => this.router.navigate(url));
  }

  logout() {
    this.menu.close().then(() => this.auth.logout());
  }
}

