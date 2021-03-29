import { Injectable, Injector } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core/abstract';
import { ApiService } from 'src/core/api';

import { UserService } from 'src/app/user';


@Injectable({
  providedIn: 'root'
})
export class LocalizacionService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  /** El componente de listado recibe una orden de mostrar el filtro para búsqueda avanzada. */
  advancedSearchSubject: Subject<boolean> = new Subject<boolean>();

  constructor(
    public injector: Injector,
    public api: ApiService,
    public user: UserService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  export(data: any): Observable<any[]> {
    return this.api.post('export', data);
  }

  import(data: any): Observable<any> {
    return this.api.post(`import`, data);
  }

}
