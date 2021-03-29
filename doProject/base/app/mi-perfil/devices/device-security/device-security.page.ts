import { Component, Injector } from '@angular/core';

import { AppConfig } from 'src/config';

import { DeviceSecuritySchema } from './device-security.schema';
import { DeviceSettingsComponent } from '../device-settings.component';


@Component ({
  selector: 'app-device-security',
  templateUrl: 'device-security.page.html',
  styleUrls: ['device-security.page.scss'],
})
export class DeviceSecurityPage extends DeviceSettingsComponent {
  protected debug = true && AppConfig.debugEnabled;

  settings = 'security';

  constructor(
    public injector: Injector,
  ) {
    super(injector, DeviceSecuritySchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  ionViewWillEnter() {
    super.ionViewWillEnter();
    if (this.debug) { console.log(this.constructor.name + '.ionViewWillEnter', this.row ); }
    // NOTA: Al entrar en la página, el navegador rellena las contraseñas.
    this.frm.controls.passwords.patchValue({ password: '', confirm: '' });
  }


  async getRow(): Promise<any> {
    return super.getRow().then(row => {
      if (this.debug) { console.log(this.constructor.name + '.getRow()', row); }
      // NOTA: A veces se obtiene la fila después de visualizar la página y el navegador rellena las contraseñas.
      this.frm.controls.passwords.patchValue({ password: '', confirm: '' });
      // Si accedemos al componente para personalizar las opciones de un dispositivo...
      if (this.isDeviceMode) {
        // Eliminar los validadores de contraseña.
        this.frm.controls.passwords.clearValidators();
      }
    });
  }

  destructureSettings(settings: any): any {
    settings = super.destructureSettings(settings);
    // Quitamos las contraseñas.
    const { passwords, password, confirm, ...deviceSettings } = settings;
    return this.clone(deviceSettings);
  }

  protected saving(row: any, host: any): any {
    row = super.saving(row, host);
    // Quitamos la contraseña si está vacía.
    if (!row.password || host.isDeviceMode) { delete row.password; }
    // Descartamos la confirmación de contraseña.
    const {confirm, ...data} = row;
    // Devolvemos la fila procesada.
    return data;
  }

}
