import { Component } from '@angular/core';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';

import { LocalizacionService } from '../localizacion.service';


@Component ({
  selector: 'app-traducciones-list-page',
  templateUrl: 'traducciones-list.page.html',
  styleUrls: ['traducciones-list.page.scss'],
})
export class TraduccionesListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public theme: ThemeService,
    public service: LocalizacionService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  showAdvancedSearch(): void {
    this.service.advancedSearchSubject.next(true);
  }

}
