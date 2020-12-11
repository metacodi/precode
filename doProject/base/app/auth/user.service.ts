import { Injectable, Optional, SkipSelf } from '@angular/core';
import { Observable } from 'rxjs';
import { PopoverController } from '@ionic/angular';

import { AppConfig } from 'src/config';
import { ApiService, ApiUserService, ApiUserWrapperService } from 'src/core/api';

import { ROLE_ADMIN, ROLE_CONDUCTOR, ROLE_CLIENTE, CONDUCTOR_FUERA_SERVICIO, CONDUCTOR_ACTIVO, CONDUCTOR_EN_TURNO, CONDUCTOR_FUERA_TURNO, CONDUCTOR_DISPONIBLE, CONDUCTOR_PENDIENTE, CONDUCTOR_OCUPADO } from 'src/app/model';
import {EstadoConductorComponent } from './estado-conductor/estado-conductor.component';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ApiUserWrapperService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public service: ApiUserService,
    public popoverController: PopoverController,
    public api: ApiService,
  ) {
    super(service);
  }


  // ---------------------------------------------------------------------------------------------------
  //  role del usuario
  // ---------------------------------------------------------------------------------------------------

  get isFlota(): boolean { return this.isAbstractRole([ROLE_ADMIN, ROLE_CONDUCTOR]); }

  get isCliente(): boolean { return this.isAbstractRole(ROLE_CLIENTE); }


  // ---------------------------------------------------------------------------------------------------
  //  conductor
  // ---------------------------------------------------------------------------------------------------

  get proveedor(): any { return this.instant?.proveedor; }

  get esConductor(): boolean { return !!this.proveedor?.esConductor; }

  get conductorIcon(): string {
    const estado: string = this.proveedor?.fueraTurno && this.proveedor?.fueraServicio ? 'fuera-turno' : 'en-turno';
    return `assets/icons/conductor-${estado}.svg`;
  }

  get conductorDisponibilidad(): number {
    return this.proveedor?.disponible;
  }

  get conductorDisponibilidadColor(): string {
    if (this.proveedor?.fueraServicio) { return 'medium'; }
    switch (this.conductorDisponibilidad) {
      case CONDUCTOR_DISPONIBLE: return 'success';
      case CONDUCTOR_PENDIENTE: return 'warning';
      case CONDUCTOR_OCUPADO: return 'danger';
      default: return 'medium';
    }
  }

  async selectEstadoConductor(ev: any) {

    const pop = await this.popoverController.create({
      component: EstadoConductorComponent,
      event: ev,
      cssClass: 'estados-conductor-popover',
      translucent: false,
      // componentProps: {
      //   prestacion,
      // }
    });

    pop.onDidDismiss().then((result: any) => {
      if (this.debug) { console.log(this.constructor.name + '.onDismiss', result.data); }
      // this.api.put(`proveedores?id=${this.instant?.proveedor.idreg}`, result.data ).pipe(catchError(error => this.api.alertError({ error, message: 'notifications.errorGeneric' }))).toPromise();
    });

    return await pop.present();
  }

}
