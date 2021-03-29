import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { AppConfig } from 'src/config';
import { AbstractListComponent } from 'src/core/abstract';

import { UserService } from 'src/app/user';

import { TraduccionesListSchema } from './traducciones-list.schema';
import { TraduccionDetailSchema } from './traduccion-detail.schema';
import { LocalizacionService } from '../localizacion.service';
import { TraduccionesSearchComponent } from './traducciones-search.component';


@Component ({
  selector: 'app-traducciones-list',
  templateUrl: 'traducciones-list.component.html',
  styleUrls: ['traducciones-list.component.scss'],
})
export class TraduccionesListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  showAdvancedSearchSubscription: Subscription;

  @ViewChild('searchbar', { static: false }) searchbar: any;


  constructor(
    public injector: Injector,
    public user: UserService,
    public service: LocalizacionService,
  ) {
    super(injector, TraduccionesListSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  ngOnInit() {
    super.ngOnInit();

    setTimeout(() => { this.searchbar.setFocus(); }, 150);
    // Recibimos notificaciones del componente de menú a través del servicio.
    this.showAdvancedSearchSubscription = this.service.advancedSearchSubject.subscribe(() => this.showAdvancedSearch());
  }

  selectRow(row: any): void {
    const query = this.service.registerQuery(TraduccionDetailSchema);
    super.selectRow(row, { route: [`/traduccion/${row.idLocalize}`], query, idreg: row.idLocalize });
  }

  showAdvancedSearch(options?: { component?: any, onDismiss?: (host: TraduccionesListComponent, data: any) => void }): void {
    super.showAdvancedSearch({ component: TraduccionesSearchComponent });
  }


}
