import { Injectable, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { AppConfig } from 'src/config';
import { AbstractModelService, EntityQuery } from 'src/core/abstract';
import { BiometricAuthService, AuthService } from 'src/core/auth';
import { ApiService } from 'src/core/api';
import { StoragePlugin } from 'src/core/native';
import { LocalizationService } from 'src/core/localization';
import { deepAssign, capitalize } from 'src/core/util';

import { UserService } from 'src/app/user';

import { DevicesService } from './devices/devices.service';


@Injectable({
  providedIn: 'root'
})
export class MiPerfilService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  /** Durante el proceso de reserva recibimos notificaciones de la creación de nuevas Misdirecciones y Pasajeros. */
  notify = new Subject();

  meta: any;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public auth: AuthService,
    public user: UserService,
    public biometric: BiometricAuthService,
    public storage: StoragePlugin,
    public devices: DevicesService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor() -> this => ', this); }
  }

  /** Interceptamos las llamadas a `users` para guardar la info en el storage. */
  saveRow(query: EntityQuery, data: object | FormGroup, options?: { host?: any, showLoader?: boolean }): Observable<any> {
    if (this.debug) { console.log(this.constructor.name + '.saveRow()', data); }
    return super.saveRow(query, data, options).pipe(mergeMap(row => {
      if (this.debug) { console.log(this.constructor.name + '.super.saveRow()', row); }
      // Interceptamos las llamadas a `users` para guardar la info en el storage.
      return query.name.plural === 'users' ? this.user.set(deepAssign(this.user.instant, row)) : of(row);
    }));
  }

  deviceIcon(operatingSystem: string): string {
    return this.devices.deviceIcon(operatingSystem);
  }
}
