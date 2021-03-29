import { Component } from '@angular/core';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';


@Component ({
  selector: 'app-idiomas-list-page',
  templateUrl: 'idiomas-list.page.html',
  styleUrls: ['idiomas-list.page.scss'],
})
export class IdiomasListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public theme: ThemeService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
