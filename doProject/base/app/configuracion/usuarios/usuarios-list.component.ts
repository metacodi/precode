import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractListComponent } from 'src/core/abstract';

import { UserService } from 'src/app/user';

import { UsuariosSchema } from './usuarios.schema';
import { UsuariosService } from './usuarios.service';


@Component ({
  selector: 'app-usuarios-list',
  templateUrl: 'usuarios-list.component.html',
  styleUrls: ['usuarios-list.component.scss'],
})
export class UsuariosListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: UsuariosService,
    public user: UserService,
  ) {
    super(injector, UsuariosSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
