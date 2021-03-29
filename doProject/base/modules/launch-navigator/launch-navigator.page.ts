import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';

import { AppConfig } from 'src/config';
import { ThemeService } from 'src/core/util';
import { LaunchNavigatorService } from './launch-navigator.service';


@Component ({
  selector: 'app-launch-navigator',
  templateUrl: 'launch-navigator.page.html',
  styleUrls: ['launch-navigator.page.scss'],
})
export class LaunchNavigatorPage {
  protected debug = true && AppConfig.debugEnabled;

  apps: string[];

  constructor(
    public platform: Platform,
    public router: Router,
    public theme: ThemeService,
    public service: LaunchNavigatorService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    this.apps = this.service.availableApps;

  }

}
