import { Component, OnInit, Injector, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';

import { AbstractListComponent } from 'src/core/abstract';
import { LocalizationService } from 'src/core/localization';

import { UserService } from 'src/app/user';

import { DevicesSchema } from './devices.schema';
import { DevicesService } from './devices.service';


@Component ({
  selector: 'app-devices-list',
  templateUrl: 'devices-list.component.html',
  styleUrls: ['devices-list.component.scss'],
})
export class DevicesListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  @Input() embedded = false;

  constructor(
    public injector: Injector,
    public user: UserService,
    public service: DevicesService,
  ) {
    super(injector, DevicesSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  cerrarSesion(row: any): void {
    this.service.closeSession(row, this);
    this.ionList.closeSlidingItems();
  }
}
