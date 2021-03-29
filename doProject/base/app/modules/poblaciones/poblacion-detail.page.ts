import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';

import { UserService } from 'src/app/user';

import { PoblacionesSchema } from './poblaciones.schema';
import { PoblacionesService } from './poblaciones.service';


@Component ({
  selector: 'app-poblacion-detail',
  templateUrl: 'poblacion-detail.page.html',
  styleUrls: ['poblacion-detail.page.scss'],
})
export class PoblacionDetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: PoblacionesService,
    public user: UserService,
  ) {
    super(injector, PoblacionesSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

}
