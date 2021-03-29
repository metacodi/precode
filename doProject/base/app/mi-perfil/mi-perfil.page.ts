import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';

import { AppConfig } from 'src/config';
import { AuthService } from 'src/core/auth';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';

import { MiPerfilService } from './mi-perfil.service';
import { MiPerfilDetailSchema } from './mi-perfil';
import { DevicesService } from './devices/devices.service';


@Component ({
  selector: 'app-mi-perfil',
  templateUrl: 'mi-perfil.page.html',
  styleUrls: ['mi-perfil.page.scss'],
})
export class MiPerfilPage {
  protected debug = true && AppConfig.debugEnabled;

  preloading: false | string = false;

  constructor(
    public miperfil: MiPerfilService,
    public auth: AuthService,
    public user: UserService,
    public theme: ThemeService,
    public router: Router,
    public service: MiPerfilService,
    public devices: DevicesService,
    // public blob: BlobService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  ionViewWillEnter() {
    this.theme.checkStatusBar(this);
    this.preloading = false;
  }

  goToMiPerfilDetail() {
    this.service.preloadRow(MiPerfilDetailSchema, this.user.instant.idreg, { navigate: '/mi-perfil/detail', parent: this, preloading: 'detail' });
  }

  goToDeviceSettings(settings: string) {
    this.devices.goToDeviceSettings(this, settings);
  }

}
