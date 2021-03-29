import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';

import { IdiomasSchema } from './idiomas.schema';
import { LocalizacionService } from '../localizacion.service';


@Component ({
  selector: 'app-idioma-detail',
  templateUrl: 'idioma-detail.page.html',
  styleUrls: ['idioma-detail.page.scss'],
})
export class IdiomaDetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public user: UserService,
    public theme: ThemeService,
    public service: LocalizacionService,
  ) {
    super(injector, IdiomasSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

}
