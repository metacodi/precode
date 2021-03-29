import { Injectable, Injector } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core/abstract';
import { ApiService, ApiUserService } from 'src/core/api';

import { UserService } from 'src/app/user';

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public user: UserService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
