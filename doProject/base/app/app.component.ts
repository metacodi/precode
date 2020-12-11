import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Platform, MenuController, AlertController } from '@ionic/angular';


// Registramos los locales. Necesarios, por ejemplo, para el pipe 'currency'.
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
registerLocaleData(localeEn, 'en');
registerLocaleData(localeEs, 'es');
registerLocaleData(localeCa, 'ca');

import { AppConfig } from 'src/config';
import { AuthenticationState, AuthService } from 'src/core/auth';
import { ApiService, BlobService } from 'src/core/api';
import { DevicePlugin, KeyboardPlugin, StatusBarPlugin, LocalNotificationPlugin } from 'src/core/native';
import { LocalizationService } from 'src/core/localization';
import { ThemeService, ThemeScheme } from 'src/core/util';

import { meta } from 'src/app/model';

import { VersionControlService } from 'src/modules/version-control';
import { UserService } from 'src/app/auth';


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
  unattendedNotificationsSubscription: Subscription;
  unattendedNotifications = 0;

  constructor(
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
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.initializeApp();

    // const p = paradas.map(p => ({
    //   id: +p._source.codi_parada.keyword,
    //   poblacion: p._source.municipi.ca_ES,
    //   codi_postal: p._source.codi_postal && p._source.codi_postal.keyword ? p._source.codi_postal.keyword : '',
    //   servicio: p._source.servei && p._source.servei.ca_ES ? p._source.servei.ca_ES : '',
    //   direccion: p._source.adreca.ca_ES,
    //   lat: p._source.on.geo_localitzacio[0].split(',')[0],
    //   lng: p._source.on.geo_localitzacio[0].split(',')[1]
    // }));
    // console.log(JSON.stringify(p));

    // // Monitorizamos la autenticación.
    // this.authenticationChangedSubscription = this.auth.authenticationChanged.subscribe((value: AuthenticationState) => {
    //   if (value.isAuthenticated) {

    //     // Si se ha autorizado se habrán recibido los blobs. Los refenciamos ahora.
    //     this.blobSubscription = this.blob.get('metaMiPerfil').subscribe((m: any) => {
    //       meta.miPerfil = {};
    //       Object.assign(meta.miPerfil, m);
    //       if (this.debug) { console.log(this.constructor.name + '.constructor -> blob.get("meta") -> meta => ', meta); }
    //     });
    //   }
    // });
  }

  initializeApp() {
    // Establecemos la ruta de la api.
    ApiService.url = AppConfig.api.url;

    // Inicializamos los temas de la aplicación.
    this.theme.initialize(AppConfig.themes as ThemeScheme[]);


    // Add Google Maps script to <head>
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `${AppConfig.google.maps.url}?language=${AppConfig.google.maps.lang}&key=${AppConfig.google.maps.key}`;
    document.head.appendChild(script);
  }

  ngOnDestroy() {
    // if (this.authenticationChangedSubscription) { this.authenticationChangedSubscription.unsubscribe(); }
    if (this.unattendedNotificationsSubscription) { this.unattendedNotificationsSubscription.unsubscribe(); }
    if (this.blobSubscription) { this.blobSubscription.unsubscribe(); }
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

