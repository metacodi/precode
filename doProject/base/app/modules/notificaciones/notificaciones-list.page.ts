import { Component } from '@angular/core';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';

import { NotificationsService } from 'src/core/notifications';


@Component ({
  selector: 'app-notificaciones-list-page',
  templateUrl: 'notificaciones-list.page.html',
  styleUrls: ['notificaciones-list.page.scss'],
})
export class NotificacionesListPage {
  protected debug = true && AppConfig.debugEnabled;

  deleteAll = false;

  constructor(
    public theme: ThemeService,
    public service: NotificationsService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  toggleUnattended() {
    this.service.toggleUnattended.next();
  }

}
