import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';

import { VersionControlService } from 'src/modules/version-control';

import { UserService } from 'src/app/user';


@Component ({
  selector: 'app-configuracion',
  templateUrl: 'configuracion.page.html',
  styleUrls: ['configuracion.page.scss'],
})
export class ConfiguracionPage {
  protected debug = true && AppConfig.debugEnabled;

  preloading = false;

  constructor(
    public user: UserService,
    public theme: ThemeService,
    public router: Router,
    public versionControl: VersionControlService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  ionViewWillEnter() {
    this.preloading = false;
  }

  getGestionPerfil(section: string){
    // TODO: recuperamos el usuario y vamos a la page
  }

}
