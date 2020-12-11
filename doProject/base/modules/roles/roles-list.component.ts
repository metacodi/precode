import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractListComponent } from 'src/core/abstract';

import { RolesSchema } from './roles.schema';
import { RolesService } from './roles.service';


@Component ({
  selector: 'app-roles-list',
  templateUrl: 'roles-list.component.html',
  styleUrls: ['roles-list.component.scss'],
})
export class RolesListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: RolesService,
  ) {
    super(injector, RolesSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  selectRow(row: any): void {
    this.preloading = row.idreg;
    this.router.navigate([`permissions`], { queryParams: { idRole: row.idreg }}).finally(() => this.preloading = false);
  }

  parents(row: any): string {
    const parents: string[] = [];
    while (row.idParent && !row.abstract) {
      row = row.parent;
      parents.push(row.name);
    }
    return parents.reverse().join(' → ');
  }

}
