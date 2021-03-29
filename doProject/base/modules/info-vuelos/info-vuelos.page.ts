import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

import { LocalizationService } from 'src/core/localization';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';

import { InfoVuelosService } from './info-vuelos.service';


@Component ({
  selector: 'app-info-vuelos',
  templateUrl: 'info-vuelos.page.html',
  styleUrls: ['info-vuelos.page.scss'],
})
export class InfoVuelosPage implements OnDestroy {

  row: any;

  statusVueloEnum = [
    { value: 'A', display: 'statusVueloEnum.Activo' },
    { value: 'C', display: 'statusVueloEnum.Cancelado' },
    { value: 'D', display: 'statusVueloEnum.Desviado' },
    { value: 'DN', display: 'statusVueloEnum.Fuente de datos necesaria' },
    { value: 'L', display: 'statusVueloEnum.Aterrizado' },
    { value: 'NO', display: 'statusVueloEnum.Fuera de servicio' },
    { value: 'R', display: 'statusVueloEnum.Redirigido' },
    { value: 'S', display: 'statusVueloEnum.Programado' },
    { value: 'U', display: 'statusVueloEnum.Desconocido' },
  ];

  messageIrregularEnum = [
    { value: 'CANCELLATION', display: 'messageIrregularEnum.CANCELLATION_MSG'},
    { value: 'CONTINUATION_OF', display: 'messageIrregularEnum.CONTINUATION_OF_MSG'},
    { value: 'DIVERSION', display: 'messageIrregularEnum.DIVERSION_MSG'},
    { value: 'FLOWN_OVER', display: 'messageIrregularEnum.FLOWN_OVER_MSG'},
    { value: 'FLYOVER', display: 'messageIrregularEnum.FLYOVER_MSG'},
    { value: 'MISCELLANEOUS', display: 'messageIrregularEnum.MISCELLANEOUS_MSG'},
    { value: 'REINSTATEMENT', display: 'messageIrregularEnum.REINSTATEMENT_MSG'},
    { value: 'REPLACED_BY', display: 'messageIrregularEnum.REPLACED_BY_MSG'},
    { value: 'REPLACEMENT_FOR', display: 'messageIrregularEnum.REPLACEMENT_FOR_MSG'},
    { value: 'RETURN_TO_GATE', display: 'messageIrregularEnum.RETURN_TO_GATE_MSG'},
    { value: 'RETURN_FROM_AIRBORNE', display: 'messageIrregularEnum.RETURN_FROM_AIRBORNE_MSG'}
  ];

  paramMapSubscription: Subscription;

  constructor(
    public service: InfoVuelosService,
    public route: ActivatedRoute,
    public theme: ThemeService,
    public translate: TranslateService,
    public user: UserService,
    public localize: LocalizationService,
  ) {

    if (this.service.preloadedRow) {
      // Obtenemos la fila precargada y limpiamos el servicio.
      this.row = this.service.preloadedRow;
      this.service.preloadedRow = undefined;

    } else {
      // Obtenemos la fila del backend.
      this.paramMapSubscription = this.route.paramMap.subscribe(paramMap => {
        this.service.navigate(paramMap.get('direccion') as 'arr' | 'dep', paramMap.get('vuelo'), paramMap.get('fecha')).then(response => {
          console.log('InfoVuelosPage.response', response);
          this.row = response;
        });
      });
    }
  }

  ngOnDestroy() {
    if (this.paramMapSubscription) { this.paramMapSubscription.unsubscribe(); }
  }


  get vuelo(): any {
    if (this.row && this.row.flightStatuses && this.row.flightStatuses.length) { return this.row.flightStatuses[0]; }
    return null;
  }

  get statusVuelo(): string {
    return this.statusVueloEnum.find(o => o.value === this.vuelo.status).display || '';
  }

  messageIrregular(valor): string {
    return this.messageIrregularEnum.find(o => o.value === valor).display || '';
  }

  get departure(): any {
    return this.vuelo.departureAirportFsCode === this.row.appendix.airports[0].fs ? this.row.appendix.airports[0] : this.row.appendix.airports[1];
  }

  get arrival(): any {
    return this.vuelo.arrivalAirportFsCode === this.row.appendix.airports[0].fs ? this.row.appendix.airports[0] : this.row.appendix.airports[1];
  }


  fechaDia(fecha: string): string {
    if (!fecha) { return ''; }
    return moment(fecha).format(this.translate.instant('reservar.fecha'));
  }

  fechaHora(fecha: string): string {
    if (!fecha) { return ''; }
    return moment(fecha).format(this.translate.instant('reservar.hora'));
  }

}
