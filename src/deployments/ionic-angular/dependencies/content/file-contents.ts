
const serviceFileContent = `import { Injectable, Injector } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core';
import { ApiService, ApiUserService } from 'src/core/api';


@Injectable({
  providedIn: 'root'
})
export class {{entityPlural}}Service extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public user: ApiUserService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
`;
