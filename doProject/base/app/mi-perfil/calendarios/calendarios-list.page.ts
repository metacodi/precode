import { Component } from '@angular/core';

import { AppConfig } from 'src/config';


@Component ({
  selector: 'app-calendarios-list-page',
  templateUrl: 'calendarios-list.page.html',
  styleUrls: ['calendarios-list.page.scss'],
})
export class CalendariosListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
