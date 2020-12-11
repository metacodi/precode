import { Component, Injector } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { AbstractComponent } from 'src/core/abstract';
import { LocalizationService } from 'src/core/localization';

import { CONDUCTOR_FUERA_SERVICIO, CONDUCTOR_ACTIVO, CONDUCTOR_EN_TURNO, CONDUCTOR_FUERA_TURNO, CONDUCTOR_DISPONIBLE, CONDUCTOR_PENDIENTE, CONDUCTOR_OCUPADO } from 'src/app/model';


@Component({
  selector: 'app-estado-conductor',
  templateUrl: 'estado-conductor.component.html',
  styleUrls: ['estado-conductor.component.scss'],
})
export class EstadoConductorComponent extends AbstractComponent {

  estados = [
    { fueraServicio: CONDUCTOR_ACTIVO, fueraTurno: CONDUCTOR_EN_TURNO, disponible: CONDUCTOR_DISPONIBLE },
    { fueraServicio: CONDUCTOR_ACTIVO, fueraTurno: CONDUCTOR_EN_TURNO, disponible: CONDUCTOR_PENDIENTE },
    { fueraServicio: CONDUCTOR_ACTIVO, fueraTurno: CONDUCTOR_EN_TURNO, disponible: CONDUCTOR_OCUPADO },
    { fueraServicio: CONDUCTOR_ACTIVO, fueraTurno: CONDUCTOR_FUERA_TURNO, disponible: CONDUCTOR_DISPONIBLE },
    { fueraServicio: CONDUCTOR_ACTIVO, fueraTurno: CONDUCTOR_FUERA_TURNO, disponible: CONDUCTOR_PENDIENTE },
    { fueraServicio: CONDUCTOR_ACTIVO, fueraTurno: CONDUCTOR_FUERA_TURNO, disponible: CONDUCTOR_OCUPADO },
    { fueraServicio: CONDUCTOR_FUERA_SERVICIO, fueraTurno: CONDUCTOR_FUERA_TURNO, disponible: null },
  ];

  constructor(
    public injector: Injector,
    public popover: PopoverController,
    public locale: LocalizationService,
  ) {
    super(injector, null);
  }

  estadoIcon(estado: any): string {
    return `assets/icons/conductor-${estado.fueraTurno && !estado.fueraServicio ? 'fuera-turno' : 'en-turno'}.svg`;
  }

  estadoDisponibilidadColor(estado: any): string {
    if (estado.fueraServicio) { return 'medium'; }
    switch (estado.disponible) {
      case CONDUCTOR_DISPONIBLE: return 'success';
      case CONDUCTOR_PENDIENTE: return 'warning';
      case CONDUCTOR_OCUPADO: return 'danger';
    }
  }

  estadoLabel(estado: any): string {
    if (estado.fueraServicio) { return this.translate.instant('estadoConductor.fueraServicio'); }
    return this.translate.instant(estado.fueraTurno ? 'estadoConductor.fueraTurno' : 'estadoConductor.enTurno') +
      ', ' + this.translate.instant('estadoConductor.' + this.estadoDisponibilidadLabel(estado));
  }

  estadoDisponibilidadLabel(estado: any): string {
    if (estado.fueraServicio) { return ''; }
    switch (estado.disponible) {
      case CONDUCTOR_DISPONIBLE: return 'disponible';
      case CONDUCTOR_PENDIENTE: return 'pendiente';
      case CONDUCTOR_OCUPADO: return 'ocupado';
    }
  }

  onClickEstadoConductor(estado: any) {
    this.popover.dismiss({ estado });
  }

}
