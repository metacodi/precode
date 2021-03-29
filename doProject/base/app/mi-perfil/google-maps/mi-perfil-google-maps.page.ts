import { Component, Injector } from '@angular/core';

import { AppConfig } from 'src/config';

import { AbstractDetailComponent } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { ThemeService, ConsoleService } from 'src/core/util';

import { UserService } from 'src/app/user';
import { CalendarsService } from 'src/app/modules/calendars';

import { MiPerfilService } from '../mi-perfil.service';
import { MiPerfilGoogleMapsSchema } from './mi-perfil-google-maps.schema';


@Component ({
  selector: 'app-mi-perfil-google-maps',
  templateUrl: 'mi-perfil-google-maps.page.html',
  styleUrls: ['mi-perfil-google-maps.page.scss'],
})
export class MiPerfilGoogleMapsPage extends AbstractDetailComponent {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public auth: AuthService,
    public user: UserService,
    public theme: ThemeService,
    public calendars: CalendarsService,
    public console: ConsoleService,
    public service: MiPerfilService,
  ) {
    super(injector, MiPerfilGoogleMapsSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
