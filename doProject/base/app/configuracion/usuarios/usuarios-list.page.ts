import { Component } from '@angular/core';

import { AppConfig } from 'src/config';


@Component ({
  selector: 'app-usuarios-list-page',
  templateUrl: 'usuarios-list.page.html',
  styleUrls: ['usuarios-list.page.scss'],
})
export class UsuariosListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
