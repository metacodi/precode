import { Component, Injector } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { StoragePlugin } from 'src/core/native';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';
import { CalendarsService } from 'src/app/modules/calendars';
import { RolesSchema, RolesListComponent } from 'src/modules/roles';

import { MiPerfilService } from '../mi-perfil.service';
import { MiPerfilDetailSchema } from './mi-perfil-detail.schema';


@Component ({
  selector: 'app-mi-perfil-detail',
  templateUrl: 'mi-perfil-detail.page.html',
  styleUrls: ['mi-perfil-detail.page.scss'],
})
export class MiPerfilDetailPage extends AbstractDetailComponent {
  protected debug = true && AppConfig.debugEnabled;

  roleSchema = RolesSchema;
  rolesList = RolesListComponent;

  constructor(
    public injector: Injector,
    public auth: AuthService,
    public user: UserService,
    public theme: ThemeService,
    public calendars: CalendarsService,
    public storage: StoragePlugin,
    public service: MiPerfilService,
  ) {
    super(injector, MiPerfilDetailSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  get isEmpresa(): boolean {
    return !!this.row && !!this.row.idempresa;
  }

  get isParticular(): boolean {
    return !!this.row && !this.row.idempresa;
  }

  async deleteRow(): Promise<any> {
    return super.deleteRow().then(result => {
      // Al eliminar el perfil deslogueamos.
      if (result) { this.auth.logout(); }
    });
  }
}
