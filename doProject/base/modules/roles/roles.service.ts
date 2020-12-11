import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core/abstract';
import { ApiService } from 'src/core/api';

import { PermissionsData } from './types';


@Injectable({
  providedIn: 'root'
})
export class RolesService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public api: ApiService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  loadPermissions(type: 'Role' | 'User', idreg: number): Promise<PermissionsData> {
    return this.api.get(`permissions?id${type}=${idreg}`).pipe(
      catchError(error => this.alertError({ error }))
    ).toPromise();
  }

  savePermissions(type: 'Role' | 'User', idreg: number, denied: string[]): Observable<any> {
    return this.api.post(`permissions`, { [`id${type}`]: idreg, denied }).pipe(
      catchError(error => this.alertError({ error }))
    );
  }

}
