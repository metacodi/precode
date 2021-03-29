import { Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';

import { UserService } from 'src/app/user';

import { DashboardSettingsService } from './dashboard-settings.service';
import { DashboardSettingsSchema } from './dashboard-settings.schema';


@Component ({
  selector: 'app-dashboard-settings',
  templateUrl: 'dashboard-settings.component.html',
  styleUrls: ['dashboard-settings.component.scss'],
})
export class DashboardSettingsComponent extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: DashboardSettingsService,
    public user: UserService,
  ) {
    super(injector, DashboardSettingsSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

}
