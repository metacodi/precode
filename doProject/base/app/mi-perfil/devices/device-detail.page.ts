import { Component, OnInit, Injector, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { LocalizationService } from 'src/core/localization';

import { UserService } from 'src/app/user';

import { DevicesService } from './devices.service';
import { DevicesSchema } from './devices.schema';


@Component ({
  selector: 'app-device-detail',
  templateUrl: 'device-detail.page.html',
  styleUrls: ['device-detail.page.scss'],
})
export class DeviceDetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  preloading: false | string = false;

  settings = ['security', 'notifications'];

  constructor(
    public injector: Injector,
    public service: DevicesService,
    public user: UserService,
    public auth: AuthService,
  ) {
    super(injector, DevicesSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  goToDeviceSettings(settings: string) {
    this.service.goToDeviceSettings(this, settings, this.row.idreg);
  }

  async cerrarSesion(): Promise<any> {
    this.service.closeSession(this.row, this);
  }

  async deleteRow(): Promise<any> {
    const idreg = this.row.idreg;
    return super.deleteRow().then(row => {
      if (this.user.instant.device.idreg === idreg) {
        this.auth.logout();
      }
    });
  }

}
