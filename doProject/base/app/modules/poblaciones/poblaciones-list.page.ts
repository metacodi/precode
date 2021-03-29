import { Component } from '@angular/core';

import { AppConfig } from 'src/config';


@Component ({
  selector: 'app-poblaciones-list-page',
  templateUrl: 'poblaciones-list.page.html',
  styleUrls: ['poblaciones-list.page.scss'],
})
export class PoblacionesListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
