import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractListComponent } from 'src/core/abstract';

import { UserService } from 'src/app/user';

import { IdiomasSchema } from './idiomas.schema';
import { LocalizacionService } from '../localizacion.service';


@Component ({
  selector: 'app-idiomas-list',
  templateUrl: 'idiomas-list.component.html',
  styleUrls: ['idiomas-list.component.scss'],
})
export class IdiomasListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public user: UserService,
    public service: LocalizacionService,
  ) {
    super(injector, IdiomasSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
