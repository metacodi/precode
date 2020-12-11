import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from 'ngx-electron';

import { AppConfig } from 'src/config';
import { AuthService } from 'src/core/auth';
import { ThemeService, ConsoleService } from 'src/core/util';
import { LocalNotificationPlugin, DevicePlugin, SplashScreenPlugin } from 'src/core/native';

import { UserService } from 'src/app/auth';
import { TIPO_SERVICIO_SOLICITUD } from 'src/app/model';



@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  preloading: false | string = false;

  // /** @hidden */
  // userGetSubscription: Subscription;
  // isCliente = false;
  // esConductor = false;

  /** @hidden */
  unattendedNotificationsSubscription: Subscription;
  unattendedNotifications = 0;
  brillo: any = null;

  constructor(
    public translate: TranslateService,
    public router: Router,
    public theme: ThemeService,
    public menu: MenuController,
    public device: DevicePlugin,
    public splashScreen: SplashScreenPlugin,
    public auth: AuthService,
    public console: ConsoleService,
    public user: UserService,
    public localNotifi: LocalNotificationPlugin,
    public electronService: ElectronService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

   
    // // Evaluamos las propiedades ahora que ya disponemos del usuario.
    // this.isCliente = this.user.isCliente;
    // this.esConductor = this.user.esConductor;
  }

  ngOnDestroy() {
    if (this.unattendedNotificationsSubscription) { this.unattendedNotificationsSubscription.unsubscribe(); }
    // if (this.userGetSubscription) { this.userGetSubscription.unsubscribe(); }
  }

  ionViewWillEnter() {
    this.theme.checkStatusBar(this);
  }

  ionViewDidEnter() {
    // Ocultamos la pantalla inicial.
    this.splashScreen.hide();

    // Electron globalShortcut
    if (this.device.is('electron')) {
      this.electronService.ipcRenderer.on('acceleratorPressed', (event, arg) => {
        if (this.debug) { console.log(this.constructor.name + '.acceleratorPressed', arg); }
        if (arg === 'Traducciones' && this.user.hasPermission('localize_lang.get')) {
          this.router.navigate(['/traducciones']);
        }
      });
    }

  }

  ionViewDidLeave() {
  }




}
