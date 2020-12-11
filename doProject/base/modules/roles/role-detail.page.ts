import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { ThemeService } from 'src/core/util';

import { RolesSchema } from './roles.schema';
import { RolesService } from './roles.service';


@Component ({
  selector: 'app-role-detail',
  templateUrl: 'role-detail.page.html',
  styleUrls: ['role-detail.page.scss'],
})
export class RoleDetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public theme: ThemeService,
    public service: RolesService,
  ) {
    super(injector, RolesSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

}
