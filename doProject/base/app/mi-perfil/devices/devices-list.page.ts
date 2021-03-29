import { Component } from '@angular/core';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';
import { LocalizationService } from 'src/core/localization';


@Component ({
  selector: 'app-devices-list-page',
  templateUrl: 'devices-list.page.html',
  styleUrls: ['devices-list.page.scss'],
})
export class DevicesListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public theme: ThemeService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
