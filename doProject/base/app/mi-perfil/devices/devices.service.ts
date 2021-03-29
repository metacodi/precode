import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import { AppConfig } from 'src/config';
import { AbstractModelService, EntityQuery } from 'src/core/abstract';
import { ApiService, BlobService } from 'src/core/api';
import { AuthService } from 'src/core/auth';
import { capitalize } from 'src/core/util';

import { UserService } from 'src/app/user';
import { DevicesSchema } from './devices.schema';


@Injectable({
  providedIn: 'root'
})
export class DevicesService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  /** Fila con los settings por defecto del disposito actual. */
  defaultSettings: any;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public auth: AuthService,
    public user: UserService,
    public blob: BlobService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  goToDeviceSettings(host: any, settings: string, idDevice?: number): void {
    if (!host.preloading) {
      // Establecemos el indicador de estado.
      host.preloading = settings;

      this.getDeviceSettings(capitalize(settings), idDevice).subscribe(data => {
        // Discernimos si se accede al componente para editar la configuración de un dispositivo o la configuración por defecto.
        if (idDevice) {
          let defaultSettings: any;
          let deviceSettings: any;
          if (data.length > 0) { data[0].idDevice ? deviceSettings = data[0] : defaultSettings = data[0]; }
          if (data.length > 1) { data[1].idDevice ? deviceSettings = data[1] : defaultSettings = data[1]; }
          // Conservamos las opciones por defecto en el servicio.
          this.defaultSettings = defaultSettings;
          // Si no hay una configuración personalizada establecemos la configuración por defecto.
          this.preloadedRow = deviceSettings || this.clone(defaultSettings);
          this.router.navigate([`${settings}-settings/${idDevice}`]);
        } else {
          // Nos llega una sola fila.
          this.preloadedRow = data[0];
          this.router.navigate([`${settings}-settings`]);
        }
        host.preloading = false;
      });
    }
  }

  getDeviceSettings(settings: string, idDevice?: number): Observable<any> {
    return this.user.get().pipe(mergeMap((user: any) => {
      const userClause = [ 'idUser', '=', user.idreg ];
      const defaultClause = [ 'idDevice', 'is', null ];
      const deviceClause = [ 'idDevice', '=', idDevice ];
      const data = { AND: [ idDevice ? { OR: [deviceClause, defaultClause] } : defaultClause, userClause] };

      return this.api.post(`search/device${settings}`, data).pipe(
        // // Si no hay un dispositivo se espera solo la fila default.
        // map(results => !idDevice ? results[0] : results),
        catchError(error => this.alertError({ error, message: 'devices.errorDeviceSettings' }))
      );
    }));
  }

  closeSession(row: any, host?: any): void {
    const query: EntityQuery = this.registerQuery(DevicesSchema);
    const data = { idreg: row.idreg, apiToken: '', apiExpiration: null };
    this.saveRow(query, data, { host }).subscribe(saved => {
      if (this.debug) { console.log(this.constructor.name + '.closeSession() -> saved', saved); }
      // Si se trata del dispositivo actual...
      if (this.user.instant?.device?.idreg === row.idreg) {
        // Forzamos un logout.
        this.auth.logout();
      }
    });
  }

  deviceIcon(operatingSystem: string): string {
    if (!operatingSystem) { return 'phone-portrait-outline'; }
    if (operatingSystem.includes('mac')) { return 'logo-apple'; }
    if (operatingSystem.includes('ios')) { return 'logo-apple'; }
    if (operatingSystem.includes('android')) { return 'logo-android'; }
    if (operatingSystem.includes('windows')) { return 'logo-windows'; }
    return 'phone-portrait-outline';
  }
}
