import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractSearchComponent } from 'src/core/abstract';

import { TraduccionesListSchema } from './traducciones-list.schema';
import { LocalizacionService } from '../localizacion.service';


@Component ({
  selector: 'app-traducciones-search',
  templateUrl: 'traducciones-search.component.html',
})
export class TraduccionesSearchComponent extends AbstractSearchComponent implements OnInit, OnDestroy {

  get idiomas(): any[] {
    return AppConfig.language.available;
  }

  constructor(
    public injector: Injector,
    public service: LocalizacionService,
  ) {
    super(injector, TraduccionesListSchema);

    if (this.debug) { console.log(this.constructor.name + '.constructor() -> service => ', this.service); }
  }

}
