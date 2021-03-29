import { Platform } from '@ionic/angular';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Calendar } from '@ionic-native/calendar/ngx';
import { Observable, of, Subscription } from 'rxjs';
import * as moment from 'moment';

import { AppConfig } from 'src/config';
import { EntityQuery, AbstractModelService } from 'src/core/abstract';
import { ApiService, ApiUserService } from 'src/core/api';
import { AuthService, AuthenticationState } from 'src/core/auth';
import { DevicePlugin, StoragePlugin } from 'src/core/native';
import { ConsoleService } from 'src/core/util';

import { UserService } from 'src/app/user';

import { CalendarsSchema } from './calendars.schema';



/**
 * Per comprobar el calendari seleccionat per l'usuari fa falta monitoritzar quan es logueja i cridar a la funció `check()`.
 * ```typescript
 * this.authenticationChangedSubscription = this.auth.authenticationChanged.subscribe((value: AuthenticationState) => {
 *   if (value.isAuthenticated) {
 *     this.calendar.check(CalendarsListComponent);
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarsService extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  private calendars: any[] = undefined;

  idsCalendarios: string[] = [];

  authenticationChangedSubscription: Subscription;

  constructor(
    public injector: Injector,
    public calendar: Calendar,
    public device: DevicePlugin,
    public auth: AuthService,
    public api: ApiService,
    public user: UserService,
    public console: ConsoleService,
    public router: Router,
    public platform: Platform,
    public storage: StoragePlugin,
  ) {
    super(injector, api);

    // Monitorizamos la autenticación.
    this.authenticationChangedSubscription = this.auth.authenticationChanged.subscribe((value: AuthenticationState) => {
      if (value.isAuthenticated) {

        // Comprobamos el calendario del usuario.
        this.check();
      }
    });

  }


  // ---------------------------------------------------------------------------------------------------
  //  Get calendars
  // ---------------------------------------------------------------------------------------------------

  getRows(query: EntityQuery, options?: { host?: any, paginate?: boolean, customFields?: string, showLoader?: boolean }): Observable<any[]> {
    // Devolvemos los calendarios de la caché.
    // if (this.calendars) { return of(this.calendars); }
    if (this.debug) { this.console.log(this.constructor.name + '.getRows()'); }
    return new Observable<any[]>(observer => {
      this.device.ready().then(() => {
        if (this.debug) { this.console.log(this.constructor.name + '.platform.ready() in get rows'); }
        if (this.device.isRealPhone) {
          // Obtenemos los calendarios del dispositivo.
          this.calendar.listCalendars().then(result => {
            if (this.debug) { this.console.log(this.constructor.name + '.getRows() -> this.calendar.listCalendars().then() ', result); }
            query.rows.push(...result.map(calendar => ({ id: calendar.id, name: calendar.name })));
            observer.next(query.rows);
            observer.complete();
          }).catch(error => observer.error(error));
        }
      }).catch(error => observer.error(error));
    });

  }

  // ---------------------------------------------------------------------------------------------------
  //  check & select
  // ---------------------------------------------------------------------------------------------------

  async check(): Promise<any> {
    return new Promise<any>(async (resolve: any, reject: any) => {
      const user = this.user.instant;
      this.idsCalendarios = [];
      // Recuperem llista de claendaris de l'Usuari
      this.api.get(`calendarios`).subscribe((calendarios: any[]) => {
        if (this.debug) { this.console.log(this.constructor.name + '.check => calendarios', calendarios); }
        if (calendarios?.length) {
          // Registramos una consulta para el esquema actual.
          const query = this.registerQuery(CalendarsSchema);
          // TODO: També s'ha de recuperar els calendaris del Google a través de la Api de Google
          this.getRows(query).subscribe(calendars => {
            if (this.debug) { this.console.log(this.constructor.name + '.check => calendars', calendars); }
            if (!calendars?.length && this.user.hasPermission('calendarios.calendarioObligatorio')) {
              this.alertCalendarioObligatorio();
            }
            if (calendars?.length) {
              calendarios.map(calendario => {
                const calendar: any = calendars.find(c => c.name === calendario.calendario);
                if (calendar) {
                  if (this.debug) { this.console.log(this.constructor.name + '.check => calendar', calendar); }
                  this.idsCalendarios.push(calendar.id);
                } else {
                  if (this.debug) { this.console.error(this.constructor.name + '.check => calendar no trobat!!!!!!!!', calendario.calendario); }
                }
              });
              if (!this.idsCalendarios?.length && this.user.hasPermission('calendarios.calendarioObligatorio')) {
                this.alertCalendarioObligatorio();
              }
              if (this.debug) { this.console.log(this.constructor.name + '.check => this.idsCalendarios: ', this.idsCalendarios); }
              resolve(true);
            }
          });
        } else if (this.user.hasPermission('calendarios.calendarioObligatorio')) {
          this.alertCalendarioObligatorio();
        } else {
          this.alertCalendario();
        }
      });
    });
  }

  alertCalendarioObligatorio() {
    this.device.ready().then(() => {
      if (this.device.isRealPhone) {
        this.showAlert({
          header: `common.Atencion`,
          message: `calendars.calendarioObligatorio`,
        }).then(response => {
          // Navegamos para seleccionar un calendario.
          if (response) { this.router.navigate(['mi-perfil/calendarios/list']); }
        });
      }
    });
  }

  alertCalendario() {
    this.device.ready().then(() => {
      if (this.debug) { this.console.log(this.constructor.name + '.platform.ready() in get rows'); }
      if (this.device.isRealPhone) {
        const user = this.user.instant;
        if (!user.device.askedForCalendarBooking) {
          this.showAlert({
            header: `common.Atencion`,
            message: `calendars.desea_utilizar_calendario`,
            YesNo: true,
          }).then(response => {
            if (response) { this.router.navigate(['mi-perfil/calendarios/list']); }
            this.api.put(`device/${user.device.idreg}`, { askedForCalendarBooking: true }).subscribe(() => {
              user.device.askedForCalendarBooking = true;
              this.user.set(user);
            });
          });
        }
      }
    });

  }

  // ---------------------------------------------------------------------------------------------------
  //  Reservas en calendario
  // ---------------------------------------------------------------------------------------------------

  updateReserva(row: any): Promise<any> {
    return new Promise<any>(resolve => {
      this.deleteReserva(row).then(result => {
        this.addReserva(row).then(() => {
          resolve(true);
        }).catch(() => resolve(false));
      }).catch(() => resolve(false));
    });
  }

  deleteReserva(row: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      const profile = this.user.instant;
      if (this.idsCalendarios?.length) {
        this.device.ready().then(() => {
          if (!this.device.isRealPhone) { resolve(null); return; }
          const startDate = moment(row.recogida).subtract(1, 'M').toDate();
          const endDate = moment(row.recogida).add(1, 'M').toDate();
          const title = this.translate.instant('calendars.reserva_title_calendar', { id: row.idreg });
          const options = this.calendar.getCalendarOptions();
          this.idsCalendarios.forEach(idCalendar => {
            // if (this.device.is('ios')) {
            //   options.id = idCalendar;
            // } else {
            //   options.calendarId = +idCalendar;
            // }
            options.id = idCalendar;
            this.calendar.findEventWithOptions(title, '', '', startDate, endDate, options).then(events => {
              if (this.debug) { this.console.log('this.calendar.findEvent ok: ', events); }
              const event = events.find(e => e.title.includes(row.idreg));
              if (event) {
                this.calendar.deleteEventById(event.id).then(result => { resolve(result); }, error => { resolve(null); });
              } else {
                resolve(null);
              }
            }, error => {
              this.console.log('this.calendar.findEvent error: ', error);
              resolve(null);
            });
          });
        }).catch(() => resolve(null));
      } else { resolve(null); }
    });
  }

  addReserva(row: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      const profile = this.user.instant;
      if (this.idsCalendarios?.length) {
        this.device.ready().then(() => {
          if (this.device.isRealPhone) {
            this.idsCalendarios.forEach(idCalendar => {
              this.createEvent(row, idCalendar).then(result => resolve(result)).catch(error => resolve(null));
            });
          } else { resolve(null); }
        }).catch(error => { this.alertError({ message: 'reservar.error_calendario' }); resolve(null); });
      } else { resolve(null); }
    });
  }

  protected createEvent(row: any, idCalendar: any): Promise<any> {
    const startDate = moment(row.recogida).toDate();
    const endDate = moment(row.recogida).add(1, 'h').toDate();
    const title = this.translate.instant('calendars.reserva_title_calendar', { id: row.idreg });
    const eventLocation = row.recogidaUbicacion.poblacion.locality + ' - ' + row.destinoUbicacion.poblacion.locality;
    // Traduccions
    const vehiculo = this.translate.instant('perfiles.Vehiculo');
    const pasajeroAnonimo = this.translate.instant('servicios.pasajero_anonimo');
    const nombre = this.translate.instant('person.nombre');
    const telefono = this.translate.instant('person.telefono');
    const email = this.translate.instant('person.email');
    const recogida = this.translate.instant('reservar.recogida');
    const numVuelo = this.translate.instant('reservar.num_vuelo');
    const facturarEquipaje = this.translate.instant('reservar.facturar_equipaje');
    const yes = this.translate.instant('buttons.yes');
    const destino = this.translate.instant('reservar.destino');
    const recogidaObservaciones = this.translate.instant('reservar.recogidaObservaciones');
    const destinoObservaciones = this.translate.instant('reservar.destinoObservaciones');
    const conductor = this.translate.instant('notification.ALERTA_CONDUCTOR_ASIGNADO');
    // Notes
    const label: string[] = [ title ];
    if (row.prestaciones.length > 1) { label.push(this.translate.instant('reservar.numVehiculos') + ': ' + row.numVehiculos); }
    let i = 1;
    (row.prestaciones as any[]).map(p => {
      if (row.prestaciones.length > 1) { label.push(vehiculo + ': ' + i); i++; }
      const pasajero = p.pasajeros?.length ? p.pasajeros[0].persona : row.cliente?.user || {};
      label.push(nombre + ': ' + (pasajero.nombre || pasajero.apellidos ? (pasajero.nombre + ' ' + pasajero.apellidos).trim() : pasajeroAnonimo));
      if (pasajero.telefono) { label.push(telefono + ': ' + pasajero.telefono); }
      if (pasajero.email) { label.push(email + ': ' + pasajero.email); }
      label.push(recogida + ': ' + row.recogidaUbicacion.direccion);
      if (row.recogidaTrackingNum) { label.push(numVuelo + ': ' + row.recogidaTrackingNum); }
      if (row.recogidaEquipajeFacturado) { label.push(facturarEquipaje + ': ' + yes); }
      label.push(destino + ': ' + row.destinoUbicacion.direccion);
      if (row.destinoTrackingNum) { label.push(numVuelo + ': ' + row.destinoTrackingNum); }
      if (row.recogidaObservaciones) { label.push(recogidaObservaciones + ': ' + row.recogidaObservaciones); }
      if (row.destinoObservaciones) { label.push(destinoObservaciones + ': ' + row.destinoObservaciones); }
      if (p.proveedor?.licencia) { label.push(conductor + ': ' + p.proveedor?.licencia); }
      label.push('');
    });
    const notes = label.join('\n');
    // Options
    const options = this.calendar.getCalendarOptions();
    options.firstReminderMinutes = 30;
    options.secondReminderMinutes = 5;
    options.id = idCalendar;
    // Create event.
    return this.calendar.createEventWithOptions(title, eventLocation, notes, startDate, endDate, options);
  }

}
