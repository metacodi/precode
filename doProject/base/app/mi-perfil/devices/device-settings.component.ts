import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Injector } from '@angular/core';
import { of, Subscription } from 'rxjs';

import { AbstractDetailComponent, EntitySchema } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { deepAssign } from 'src/core/util';

import { AppConfig } from 'src/config';
import { StoragePlugin } from 'src/core/native';

import { UserService } from 'src/app/user';

import { DevicesService } from './devices.service';


@Component ({
  selector: 'app-device-settings',
  template: ``,
})
export class DeviceSettingsComponent extends AbstractDetailComponent implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  auth: AuthService;
  user: UserService;
  service: DevicesService;
  storage: StoragePlugin;

  settings: string;
  idDevice: number;
  deviceSettings: any;
  allowChangeOptionsSubscription: Subscription;

  constructor(
    public injector: Injector,
    public schema: EntitySchema,
  ) {
    super(injector, schema);
    if (this.debug) { console.log('DeviceSettingsComponent.' + this.constructor.name + '.constructor()'); }

    this.auth = this.injector.get<AuthService>(AuthService);
    this.user = this.injector.get<UserService>(UserService);
    this.storage = this.injector.get<StoragePlugin>(StoragePlugin);
    this.service = this.injector.get<DevicesService>(DevicesService);

    // NOTA: Discernimos si se accede al componente para editar las opciones de un dispositivo o las generales.
    this.route.params.subscribe(params => this.idDevice = +params.idDevice);
  }

  ngOnDestroy() {
    if (this.allowChangeOptionsSubscription) { this.allowChangeOptionsSubscription.unsubscribe(); }
    super.ngOnDestroy();
  }


  async getRow(): Promise<any> {
    return super.getRow().then(row => {
      if (this.debug) { console.log('DeviceSettingsComponent.' + this.constructor.name + '.getRow()', row); }
      // Si accedemos al componente para personalizar las opciones de un dispositivo...
      if (this.isDeviceMode) { this.initializeDeviceSettings(row); }
    });
  }

  initializeDeviceSettings(row: any): void {
    // Obtenemos la configuración para el dispositivo...
    this.deviceSettings = row.idDevice
      // de la configuración personalizada existente.
      ? this.destructureSettings(row)
      // creando una configuración nueva a partir de la configuración por defecto.
      : deepAssign(this.destructureSettings(this.service.defaultSettings), { idreg: 'new', idDevice: this.idDevice });
    // Chequeamos el control de configuración personalizada.
    this.frm.patchValue({ allowChangeOptions: !!row.idDevice });
    // Monitorizamos el cambio de valor del checkbox.
    this.allowChangeOptionsSubscription  = this.frm.controls.allowChangeOptions.valueChanges.subscribe(value => this.toggleSettings(value));
  }

  toggleSettings(value: any): void {
    if (value) {
      // Establecemos la configuración personalizada.
      this.frm.patchValue(this.deviceSettings);
    } else {
      // Recordamos las preferencias personalizadas.
      deepAssign(this.deviceSettings, this.destructureSettings(this.frm.value));
      // Establecemos la configuración por defecto.
      this.frm.patchValue(this.service.defaultSettings);
    }
  }

  destructureSettings(settings: any): any {
    const { allowChangeOptions, ...deviceSettings } = settings;
    return this.clone(deviceSettings);
  }

  async saveRow(): Promise<any> {
    // Si estamos editando la configuración por defecto o se ha habilitado una configuración personalizada.
    if (!this.isDeviceMode || this.row.allowChangeOptions) {
      // Guardamos la configuración actual (por defecto o personalizada).
      return super.saveRow().then(saved => {
        if (this.debug) { console.log('DeviceSettingsComponent.' + this.constructor.name + '.saveRow()', saved); }
        const user = this.user.instant;
        // Si es el dispositivo actual o si es la configuración por defecto.
        if (user.device.idreg === saved.idDevice || user.device[this.settings].idDevice === saved.idDevice) {
          // Actualizamos la configuración del usuario.
          deepAssign(user.device[this.settings], saved);
          // Actualizamos el storage.
          return this.user.set(user).then(() => saved);

        } else {
          return saved;
        }
      });

    } else {
      // Modo device descartado.
      if (this.deviceSettings.idreg === 'new') {
        // Descartamos la nueva configuración.
        return of().toPromise().then(() => this.nav.pop());

      } else {
        // Establecemos la configuración personalizada que queremos borrar.
        this.frm.patchValue(this.deviceSettings);
        // Eliminamos la configuración personalizada del dispositivo.
        return super.deleteRow().then(() => {
          if (this.debug) { console.log('DeviceSettingsComponent.' + this.constructor.name + '.deleteRow'); }
          const user = this.user.instant;
          // Si es el dispositivo actual...
          if (user.device[this.settings].idDevice === this.idDevice) {
            // Restablecemos la configuración por defecto.
            deepAssign(user.device[this.settings], this.service.defaultSettings);
            // Actualizamos el storage.
            return this.user.set(user);
          }
        });
      }
    }
  }

  protected saving(row: any, host: any): any {
    // Descartamos la confirmación de contraseña.
    const {allowChangeOptions, ...data} = row;
    // Devolvemos la fila procesada.
    return data;
  }

  get isDeviceMode(): boolean {
    return !!this.idDevice;
  }

}
