import { Component } from '@angular/core';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';


@Component ({
  selector: 'app-roles-list-page',
  templateUrl: 'roles-list.page.html',
  styleUrls: ['roles-list.page.scss'],
})
export class RolesListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public theme: ThemeService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
