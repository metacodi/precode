import { Injectable, Injector } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core/abstract';
import { ApiService } from 'src/core/api';
import { AuthService } from 'src/core/auth';


@Injectable({
  providedIn: 'root'
})
export class ContactarService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public auth: AuthService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
