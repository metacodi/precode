import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';

import { UserService } from 'src/app/user';
import { RolesSchema, RolesListComponent } from 'src/modules/roles';

import { UsuariosSchema } from './usuarios.schema';
import { UsuariosService } from './usuarios.service';


@Component ({
  selector: 'app-usuario-detail',
  templateUrl: 'usuario-detail.page.html',
  styleUrls: ['usuario-detail.page.scss'],
})
export class UsuarioDetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  roleSchema = RolesSchema;
  rolesList = RolesListComponent;


  constructor(
    public injector: Injector,
    public service: UsuariosService,
    public user: UserService,
  ) {
    super(injector, UsuariosSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

}