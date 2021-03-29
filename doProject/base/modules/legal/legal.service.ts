import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AppConfig } from 'src/config';
import { AbstractBaseClass } from 'src/core/abstract';
import { ApiService } from 'src/core/api';

import { UserService } from 'src/app/user';

@Injectable({
  providedIn: 'root'
})
export class LegalService extends AbstractBaseClass {
  protected debug = true && AppConfig.debugEnabled;

  /** Contenido del texto */
  contentHtml: any;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public user: UserService,
  ) {
    super(injector);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Obtiene el texto legal en el idioma de la sesión del usuario. */
  getLegal(): Observable<any> {
    return this.api.get(`/legal`, { responseType: 'text' }).pipe(
      catchError(error => this.alertError({ error, message: 'legal.error_message' }))
    );
  }
}
