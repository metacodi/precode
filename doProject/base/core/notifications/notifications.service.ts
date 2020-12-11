import { Injectable, OnDestroy, Injector } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Subscription, Observable, Subject, of, from, interval, SchedulerLike } from 'rxjs';
import { ToastController, AnimationController } from '@ionic/angular';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { Plugins, PushNotification } from '@capacitor/core';
import { FCM } from '@capacitor-community/fcm';
import { ElectronService } from 'ngx-electron';

import { AppConfig } from 'src/core/app-config';
import { AbstractModelService, EntityQuery } from 'src/core/abstract';
import { AuthService, AuthenticationState } from 'src/core/auth';
import { ApiSearchAndClauses, ApiService, ApiUserService, BlobService, findRowIndex } from 'src/core/api';
import { StoragePlugin, DevicePlugin } from 'src/core/native';
import { ConsoleService, evalExpr, deepAssign } from 'src/core/util';

import { Notified } from './notifications.types';
import { NotificationsSchema } from './notifications.schema';


const { PushNotifications } = Plugins;
const fcm = new FCM();

/**
 * Servicio genérico con doble funcionalidad:
 * - Informa del token del dispositivo del usuario.
 * - Resuelve las notificaciones push del usuario.
 *
 * Extender la clase base en el nuevo proyecto e implementar las funciones específicas del proyecto para la correcta resolución de las acciones de la notificación.
 */
export abstract class NotificationsService extends AbstractModelService implements OnDestroy {
  static defaultPushInterval = 30000;
  protected debug = true && AppConfig.debugEnabled;

  /** Notifica cuando la operación  */
  deleteAll: Subject<boolean> = new Subject<boolean>();

  /** Informa de la cantidad de notificaciones desatendidas. */
  unattendedNotifications: Subject<number> = new Subject<number>();

  deviceToken: string;
  pendingTokenUpdate = false;


  /** Almacena las notificaciones recibidas a la espera de que puedan ser resueltas. */
  notifications: Notified[] = [];

  /** Almacena las notificaciones notificationsUnatended. */
  notificationsUnatended: Notified[] = [];


  /** Propiedades del host que se pasan a las expresiones de código evaluado. */
  filterProperties = ['showNotificationAlert', 'navigate'];

  /** Duración  Toast */
  toastDuration: number;

  notificacionStored: any;

  device: DevicePlugin;
  auth: AuthService;
  user: ApiUserService;
  router: Router;
  console: ConsoleService;
  blob: BlobService;
  /** Este servicio administra su propia consulta. */
  query: EntityQuery;
  storage: StoragePlugin;
  pushNotificationReceived: Subject<Notified>;

  toastController: ToastController;
  electronService: ElectronService;
  animationCtrl: AnimationController;

  /** @hidden */
  authenticationChangedSubscription: Subscription;
  /** @hidden Suscriptor a un intervalo de consultas. */
  intervalRequest: Subscription;
  /** @hidden */
  blobSubscription: Subscription;

  constructor(
    public injector: Injector,
    public api: ApiService,
    // public schema: EntitySchema,
  ) {
    super(injector, api);

    /** @category Dependencies */
    this.device = this.injector.get<DevicePlugin>(DevicePlugin);
    /** @category Dependencies */
    this.auth = this.injector.get<AuthService>(AuthService);
    /** @category Dependencies */
    this.user = this.injector.get<ApiUserService>(ApiUserService);
    /** @category Dependencies */
    this.router = this.injector.get<Router>(Router);
    /** @category Dependencies */
    this.console = this.injector.get<ConsoleService>(ConsoleService);
    /** @category Dependencies */
    this.blob = this.injector.get<BlobService>(BlobService);
    /** @category Dependencies */
    this.storage = this.injector.get<StoragePlugin>(StoragePlugin);
    /** @category Dependencies */
    this.toastController = this.injector.get<ToastController>(ToastController);
    /** @category Dependencies */
    this.electronService = this.injector.get<ElectronService>(ElectronService);
    /** @category Dependencies */
    this.animationCtrl = this.injector.get<AnimationController>(AnimationController);

    if (this.debug) { this.console.log(this.constructor.name + '.constructor()'); }

    // Instanciamos una consulta independiente de cualquier AbstractListComponent.
    this.query = new EntityQuery(NotificationsSchema);

    if (this.debug) { this.console.log(this.constructor.name + ' goto -> this.device.ready()'); }

    // Instanciamos un nuevo emisor de eventos para notificar las notificaciones recibidas.
    this.pushNotificationReceived = new Subject<any>();

    // Monitorizamos el cambio de token del dispositivo del usuario.
    this.device.ready().then(() => {
      if (this.debug) { this.console.log(this.constructor.name + ' this.device.ready()'); }
      if (this.device.isRealPhone) {
        if (this.debug) { this.console.log(this.constructor.name + ' this.device.isRealPhone'); }
        PushNotifications.requestPermission().then(result => {
          if (result.granted) {
            // Register with Apple / Google to receive push via APNS/FCM
            PushNotifications.register().then(() => { }).catch(err => alert(JSON.stringify(err)));
          } else {
            // Show some error
            // TODO: Mostrar un mensaje para sugerir al usuario que debe habilitar el sistema de notificaciones para esta aplicación.
          }
        });

        // Establecemos el token del device.
        fcm.getToken().then(response => this.setDeviceToken(response.token));
      }

      // Monitorizamos la autenticación para detectar el login.
      this.authenticationChangedSubscription = this.auth.authenticationChanged.subscribe((value: AuthenticationState) => this.onAuthenticationChanged(value));

      // Recibimos las notificaciones que van llegando en tiempo de ejecución.
      if (this.device.isRealPhone) {
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotification) => this.onPushNotificationReceived(notification));
      }
    });

  }

  ngOnDestroy(): void {
    this.stopIntervalRequest();
    if (this.authenticationChangedSubscription) { this.authenticationChangedSubscription.unsubscribe(); }
    if (this.blobSubscription) { this.blobSubscription.unsubscribe(); }
  }

  // ---------------------------------------------------------------------------------------------------
  //  AuthenticationChanged
  // ---------------------------------------------------------------------------------------------------

  onAuthenticationChanged(value: AuthenticationState): void {
    if (this.debug) { this.console.log(this.constructor.name + '.constructor() -> authenticationChanged.subscribe(AuthenticationState)', value); }
    if (value.isAuthenticated) {
      // Comprobamos si todavía está pendiente de establecer el token.
      if (this.pendingTokenUpdate) { this.saveDeviceToken(); }
      // Obtenemos la configuración.
      if (!this.device.isRealPhone) {
        if (this.blobSubscription) { this.blobSubscription.unsubscribe(); }
        this.blobSubscription = this.blob.get('notificationsSettings').subscribe(data => {
          this.toastDuration = data.toastDuration;
          NotificationsService.defaultPushInterval = data.pushInterval;
          // Iniciamos el intervalo de consultas de notificaciones.
          this.startIntervalRequest(data.pushInterval);
        });
      }

    } else {
      // Limpiamos la cola de notificaciones.
      this.notifications = [];
      // TODO: Remplazar el array interno por una consulta compartida con el componente de listado de notificaciones.
      // this.query.clear();
      // Detenemos el intervalo de consultas de notificaciones.
      this.stopIntervalRequest();
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Device token
  // ---------------------------------------------------------------------------------------------------

  protected setDeviceToken(token: string): void {
    if (this.debug) { this.console.log(this.constructor.name + '.setDeviceToken() -> token => ', token); }
    // Establecemos el indicador de estado.
    this.pendingTokenUpdate = !!token && this.deviceToken !== token;
    this.deviceToken = token;
    if (this.pendingTokenUpdate) {
      // Actualizamos el token en el storage.
      this.user.get().subscribe(user => {
        if (user) {
          user.device.deviceToken = this.deviceToken;
          this.user.storeDevice(user.device);
        }
      });
    }
    if (this.auth.isAuthenticated && this.pendingTokenUpdate) { this.saveDeviceToken(); }
  }

  protected saveDeviceToken(): void {
    if (this.debug) { this.console.log(this.constructor.name + '.saveDeviceToken()'); }
    this.user.get().pipe(first()).subscribe(user => {
      if (this.debug) { this.console.log(this.constructor.name + '.saveDeviceToken() -> deviceToken => ', this.deviceToken); }
      // Actualizamos el nuevo token del dispositivo en el backend.
      this.api.put(`device?id=${user.device.idreg}`, { deviceToken: this.deviceToken }).pipe(
        tap(response => this.pendingTokenUpdate = false),
        catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))
      );
    });
  }

  // ---------------------------------------------------------------------------------------------------
  //  Push
  // ---------------------------------------------------------------------------------------------------

  /** Atendemos la notificación llegada desde el plugin FCM. */
  onPushNotificationReceived(notification: PushNotification): void {
    // Si todavía no está autenticado...
    if (!this.auth.isAuthenticated) {
      // Almacenamos la notificación para que sea la primera en ejecutarse de la cola.
      this.notificacionStored = notification.data;
    } else {
      // Cargamos la notificación.
      this.loadNotification(+notification.data.idNotification).subscribe((notified: Notified) => {
        // Emitimos la push para quien la quiera.
        this.pushNotificationReceived.next(notified);
      });
    }
  }

  /** Obtiene las notificaciones pendientes de la base de datos. */
  load(): Observable<Notified[]> {
    return this.requestNotifications({ AND: [['attended', 'is', null], ['deleted', 'is', null]] }).pipe(tap((response: Notified[]) => {
      if (response) {
        // Limpiamos la colección.
        this.notifications = response;
        // Marcar las notificaciones como recibidas.
        this.markAllAsReceived(response);
        // Contar las desatendidas.
        this.unattendedNotifications.next(this.notifications.filter(n => !n.attended).length);
        //
        const idsPendents = [];
        this.notifications.map(n => {
          // const found = response.find(r => r.idreg === n.idreg && n.needToSolve ... condicions pq no ha vingut entre les pendets);
          // if (!found) { idsPendents.push(found.idreg); }
        });
        if (idsPendents.length) {

        }
      }
      return this.notifications;
    }));
  }

  /** Obtiene las notificaciones pendientes de la base de datos. */
  loadNotification(idNotification: number): Observable<Notified> {
    return this.requestNotifications({ AND: [['idNotification', '=', idNotification]] }).pipe(switchMap((response: Notified[]) => {
      if (!response?.length) { return of(); }
      // Solo antendemos la primera recibida.
      const notified = response[0];
      this.markAsReceived(notified);
      return of(notified);
    }));
  }

  /** Obtiene las notificaciones de la base de datos. */
  requestNotifications(search: ApiSearchAndClauses): Observable<Notified[]> {
    // Obtenemos el identificador del usuario.
    return this.user.get().pipe(switchMap<any, Observable<Notified[]>>(user => {
      if (user) {
        // Inyectamos la cláusula del usuario.
        search.AND.push(['idUser', '=', user.idreg]);
        // Consulta auto-administrada.
        return from(this.query.resolveUrl({ paginate: false })).pipe(switchMap<string, Observable<Notified[]>>(url => {
          // Solicitamos únicamente las notificaciones del usuario actual.
          return this.api.post(url, search).pipe(map((notifications: Notified[]) => {
            // Mapeamos las notificaciones que nos llegan del back-end.
            if (notifications) {
              return notifications.map(notified => {
                if (!!notified.notification.data && typeof notified.notification.data === 'string') {
                  try {
                    notified.notification.data = JSON.parse(notified.notification.data as any);
                  } catch (error) {
                    if (this.debug) { console.error(this.constructor.name + '.requestNotifications', error); }
                    // throw Error(error);
                  }
                }
                notified.header = {
                  key: Object.values(notified.notification.notificationType.localize).join('.'),
                  interpolateParams: notified.notification.data as object
                };
                return notified;
              });
            }
          }), catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false })));
        }));
      }
    }));
  }

  /** @hidden */
  protected mapNotified(notified: Notified): Notified {
    notified.notification.data = JSON.parse(notified.notification.data as any);
    notified.header = {
      key: Object.values(notified.notification.notificationType.localize).join('.'),
      interpolateParams: notified.notification.data as object
    };
    return notified;
  }

  // ---------------------------------------------------------------------------------------------------
  //  Crea un timer que realiza llamadas periódicas para recuperar las notificaciones del backend.
  // ---------------------------------------------------------------------------------------------------

  /**
   * Inicia un intervalo de consultas periódicas para recuperar las notificaciones desde _backend_.
   *
   * La operación se detiene con una llamada a {@link stopIntervalRequest}().
   *
   * @param search Cláusula válida para la API Rest. La función inyecta automáticamente la restricción del usuario actual: `['idUser', '=', user.idreg]`.
   * @param period The interval size in milliseconds (by default) or the time unit determined by the scheduler's clock.
   * @param scheduler The {@link SchedulerLike} to use for scheduling the emission of values, and providing a notion of "time".
   */
  protected startIntervalRequest(period?: number, scheduler?: SchedulerLike) {
    if (!period) { period = NotificationsService.defaultPushInterval; }
    if (AppConfig.notifications?.allowIntervalRequest === false) { return; }
    this.stopIntervalRequest();
    this.intervalRequest = interval(period, scheduler).subscribe(() => {
      // NOTA: Puede que hayamos detenido el interval pero el último ciclo aún se lanza cuando ya no está autenticado.
      if (!this.auth.isAuthenticated) { return; }
      // Recuperamos las notificaciones pendientes.
      const data: ApiSearchAndClauses = { AND: [{ OR: [['received', 'is', null], ['attended', 'is', null]] }, ['deleted', 'is', null]] };
      this.requestNotifications(data).subscribe(response => {
        if (response) {
          this.notificationsUnatended = response;
          response.map(notified => {
            // if (this.debug) { console.log(this.constructor.name + '.startIntervalRequest() -> requestNotifications', notified.received); }
            if (!notified.received) {
              // if (this.debug) { console.log(this.constructor.name + '.startIntervalRequest() -> requestNotifications -> pushNotificationReceived.next()'); }
              this.pushNotificationReceived.next(notified);
            }
          });
          // if (this.debug) { console.log(this.constructor.name + '.startIntervalRequest() -> unattendedNotifications.next'); }
        }
      });
    });
  }

  /** Detiene un intervalo de consultas iniciado a través de {@link startIntervalRequest}(). */
  protected stopIntervalRequest(): void {
    if (this.intervalRequest) { this.intervalRequest.unsubscribe(); }
  }

  set pushInterval(milliseconds: number) {
    this.stopIntervalRequest();
    this.startIntervalRequest(milliseconds);
  }

  // ---------------------------------------------------------------------------------------------------
  //  Execute notifications
  // ---------------------------------------------------------------------------------------------------

  /** Resuelve la siguiente notificación push pendiente de ser atendida. */
  executeQueue(): void {
    // Cargamos las notificaciones de la base de datos.
    this.load().subscribe(() => {
      if (this.debug) { this.console.log(this.constructor.name + '.executeQueue() -> this.load => ', this.notifications); }
      // Resolvemos la primera que llega.
      this.notificationsUnatended = this.notifications;
      const found = this.notifications?.find((notified: Notified) => this.notificacionStored ? this.notificacionStored.idNotification === notified.notification.idreg : !notified.attended);
      // if (this.debug) { this.console.log(this.constructor.name + '.executeQueue() -> found', found); }
      // Borramos la información de la notificación almacenada.
      this.notificacionStored = undefined;
      if (found) {
        // Comprobamos que va dirigida al usuario actual, sino volvemos a lanzar la ejecución de la cola.
        if (found.idUser === this.user.instant.idreg) { this.pushNotificationReceived.next(found); } else { this.executeQueue(); }
      }
    });
  }

  /** Marca las notificaciones como recibidas. */
  async markAllAsReceived(notifications: Notified[]): Promise<any> {
    if (this.debug) { console.log(this.constructor.name + '.markAllAsReceived()'); }
    const ids: number[] = notifications.filter(notified => !notified.received).map((notified: Notified) => {
      notified.received = moment().format('YYYY-MM-DD HH:mm:ss');
      if (this.debug) { console.log(this.constructor.name + '.markAllAsReceived(),', notified.received); }
      return notified.idreg;
    });
    if (ids.length) {
      // return this.api.post(`notified_received`, { ids, idUser: this.user.instant.idreg }).pipe(catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))).toPromise();
    } else {
      return of().toPromise();
    }
  }

  /** Marca la notificación indicada como solventada. */
  async markAsReceived(notified: Notified): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.markAsReceived(notified) => ', notified); }

    // return of().toPromise();
    // Envia al backend el estado de notificación atendida.
    return this.api.put(`notified?id=${notified.idreg}`, { received: moment().format('YYYY-MM-DD HH:mm:ss') }).pipe(catchError(error => this.alertError({ error, message: 'notifications.errorGeneric' }))).toPromise();
  }

  /** Indica que la notificación actual ha sido atendida correctamente. */
  async markAsAttended(notified: Notified): Promise<any> {
    // Envia al backend el estado de notificación atendida.
    return this.api.put(`notified?id=${notified.idreg}`, { attended: moment().format('YYYY-MM-DD HH:mm:ss') }).pipe(
      tap(() => {
        // if (this.debug) { this.console.log(this.constructor.name + '.markAsAttended -> tap() => ', this.notifications); }
        // Eliminamos la notificación atendida de la cola de notificaciones pendientes.
        if (this.notifications.length) {
          const idx: number = this.notifications.indexOf(notified);
          if (!isNaN(idx)) {
            // if (this.debug) { this.console.log(this.constructor.name + '.markAsAttended -> splice', idx); }
            this.notifications.splice(idx, 1);
          }
        }
      }),
      catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false })),
    ).toPromise();
  }

  /** Marca la notificación indicada como solventada. */
  async markAsSolved(notified: Notified): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.markAsSolved(notified) => ', notified); }

    // Envia al backend el estado de notificación atendida.
    return this.api.put(`notified?id=${notified.idreg}`, { solved: moment().format('YYYY-MM-DD HH:mm:ss'), attended: moment().format('YYYY-MM-DD HH:mm:ss') }).pipe(
      tap(() => {
        // if (this.debug) { this.console.log(this.constructor.name + '.markAsAttended -> tap() => ', this.notifications); }
        // Eliminamos la notificación atendida de la cola de notificaciones pendientes.
        if (this.notifications.length) {
          const idx: number = this.notifications.indexOf(notified);
          if (!isNaN(idx)) {
            // if (this.debug) { this.console.log(this.constructor.name + '.markAsAttended -> splice', idx); }
            this.notifications.splice(idx, 1);
          }
        }
      }),
      catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false })))
      .toPromise();
  }


  async markAll(notified: Notified): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.markAsSolved(notified) => ', notified); }

    // Envia al backend el estado de notificación atendida.
    return this.api.put(`notified?id=${notified.idreg}`, { solved: moment().format('YYYY-MM-DD HH:mm:ss'), received: moment().format('YYYY-MM-DD HH:mm:ss'), attended: moment().format('YYYY-MM-DD HH:mm:ss') })
      .pipe(catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))).toPromise();
  }

  /** Marca la notificación indicada como solventada. */
  async markNotificationAsSolved(notified: Notified): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.markAsSolved(notified) => ', notified); }
    // Envia al backend el estado de notificación atendida.
    return this.api.put(`notification?id=${notified.idNotification}`, { solved: moment().format('YYYY-MM-DD HH:mm:ss') })
      .pipe(catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))).toPromise();
  }

  /** Elimina todas las notificacione ya atendidas. */
  async deleteAllAttended(): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.deleteAllAttended()'); }

    return this.api.get('notified_archivar').pipe(catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))).toPromise().then(() => {
      this.query.rows = this.query.rows.filter(row => !row.attended);
    });
  }

  async deteleNotification(notified: Notified): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.markAsSolved(notified) => ', notified); }
    // Envia al backend el estado de notificación atendida.
    return this.api.put(`notified?id=${notified.idreg}`, { solved: moment().format('YYYY-MM-DD HH:mm:ss'), received: moment().format('YYYY-MM-DD HH:mm:ss'), attended: moment().format('YYYY-MM-DD HH:mm:ss'), deleted: moment().format('YYYY-MM-DD HH:mm:ss') })
      .pipe(
        tap(() => {
          // if (this.debug) { this.console.log(this.constructor.name + '.markAsAttended -> tap() => ', this.notifications); }
          // Eliminamos la notificación atendida de la cola de notificaciones pendientes.

          // const idx: number = this.notifications.indexOf(notified);
          // if (!isNaN(idx)) {
          //   // if (this.debug) { this.console.log(this.constructor.name + '.markAsAttended -> splice', idx); }
          //   this.notifications.splice(idx, 1);
          // }

        }),
        catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false })))
      .toPromise();
  }



  // ---------------------------------------------------------------------------------------------------
  //  Proceso de ejecució de una notificación
  // ---------------------------------------------------------------------------------------------------

  /** Ejecuta la acción de la notificación en función de su estado. Si no está atendida, lanza una alerta primero. */
  async executeNotification(notified: Notified, isNew?: boolean): Promise<any> {
    if (this.debug) { console.log(this.constructor.name + '.executeNotification', notified); }

    if (isNew) {
      if (!notified.attended) {
        return this.doAttend(notified);
      } else if (!notified.solved && isNew && !notified.notification.notificationType.needToSolve) {
        return this.doAlert(notified).then(() => this.markNotificationAsSolved(notified));
      } else if (!notified.solved && notified.SolvedActions) {
        return this.doSolve(notified, notified.SolvedActions.code);
      } else {
        return from(undefined).toPromise();
      }
    } else {
      if (!notified.attended) {
        return this.doAttend(notified);
      } else if (notified.SolvedActions) {
        return this.doSolve(notified, notified.SolvedActions.code).then(() => {
          if (!notified.solved && !notified.notification.notificationType.needToSolve) { this.markNotificationAsSolved(notified); }
        });
      } else if (notified.AttendedActions) {
        this.doSolve(notified, notified.AttendedActions.code);
      }
      else {
        return from(undefined).toPromise();
      }
    }
  }

  async doAttend(notified: Notified): Promise<any> {
    if (notified.notification.notificationType.showAlert) {
      return this.doAlert(notified);
    } else if (notified.notification.notificationType.needToSolve) {
      return this.markAsAttended(notified).then(() => this.doSolve(notified, notified.AttendedActions.code));
    } else {
      return this.markNotificationAsSolved(notified);
    }
  }

  async doAlert(notified: Notified): Promise<any> {
    if (!notified.notification.notificationType.needToSolve && !notified.notification.notificationType.showYesNo) {
      this.markNotificationAsSolved(notified);
    }
    return this.presentToast(notified, notified.header, notified.notification.notificationType.showYesNo ? { key: 'notificaciones.quiere_atenderla' } : undefined).then(async response => {
      if (response) {
        if (notified.notification.notificationType.needToSolve) {
          return this.markAsAttended(notified).then(() => this.doSolve(notified, notified.AttendedActions.code));
        } else if (!notified.solved && !notified.notification.notificationType.needToSolve) {
          return this.doSolve(notified, notified.AttendedActions?.code ? notified.AttendedActions.code : notified.SolvedActions.code).then(() => this.markNotificationAsSolved(notified).then(() => this.markAsAttended(notified)));
        }
      } else {
        return from(undefined).toPromise();
      }
    });
  }

  async doSolve(notified: Notified, code: string): Promise<any> {
    return this.executeActions(notified, code);
  }

  /** Resuelve una notificación y devuelve un valor booleano indicando si ha sido resuelta. */
  async executeActions(notified: Notified, code: string, args?: { [key: string]: any }): Promise<any> {
    if (this.debug) { this.console.log(this.constructor.name + '.execute(notified) => ', notified); }
    // Pasamos notified dentro de notified para que sus propiedades tb se propaguen en las expresiones de código.
    (notified as any).notified = notified;
    // Propagamos las propiedades de data a la notificación.
    notified = deepAssign(notified, notified.notification.data);
    // Propagamos los argumentos adicionales suministrados.
    notified = deepAssign(notified, args);
    // Propagamos todas las propiedades de 'notified' y las del host indicadas en 'filterProperties'.
    return evalExpr(code, { args: notified, host: this, filterProperties: this.filterProperties });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Acciones genéricas
  // ---------------------------------------------------------------------------------------------------

  async navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate(commands, extras);
  }

  async showNotificationAlert(notified: Notified, header: { key: string; interpolateParams: { [key: string]: any } }, message?: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const showYesNo = notified.notification.notificationType.showYesNo;
      const op: any = {};
      if (header) { op.header = this.resolveTranslate(this.translate.instant(header.key, header.interpolateParams)); }
      if (message) { op.message = this.resolveTranslate(this.translate.instant(message.key, message.interpolateParams)); }
      if (showYesNo) {
        op.buttons = [
          {
            text: this.translate.instant('buttons.no'),
            handler: () => resolve(false),
          }, {
            text: this.translate.instant('buttons.yes'),
            handler: () => {
              this.markAsAttended(notified).then(() => notified.attended = moment().format('YYYY-MM-DD HH:mm:ss'));
              resolve(true);
            }
          }
        ];

      } else {
        this.markAsAttended(notified).then(() => notified.attended = moment().format('YYYY-MM-DD HH:mm:ss'));
        op.buttons = [{
          text: this.translate.instant('buttons.accept'),
          handler: () => resolve(true)
        }];
      }

      this.alertCtrl.create(op).then(alert => alert.present()).catch(error => reject(error));
    });
  }

  async presentToast(notified: Notified, header: { key: string; interpolateParams: { [key: string]: any } }, message?: any, duration?: number, css?: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {

      const showYesNo = notified.notification.notificationType.showYesNo;
      const op: any = {};
      if (header) { op.header = this.resolveTranslate(this.translate.instant(header.key, header.interpolateParams)); }
      if (message) { op.message = this.resolveTranslate(this.translate.instant(message.key, message.interpolateParams)); }
      if (!duration) { duration = this.toastDuration; }
      if (!css) { css = 'toast-custom-class'; }
      op.duration = duration ? duration : 4000;
      op.buttons = [{ text: '', icon: 'notifications', side: 'start' }, ];
      op.position = 'top';
      op.cssClass = css;
      this.toastController.create(op).then((toast) => {
        toast.present();
        if (notified.notification.notificationType.needToSolve || notified.notification.notificationType.showYesNo) {
          toast.addEventListener('click', (ev => {
            toast.dismiss();
            resolve(true);
          }));
        }
      });
      if (this.device.is('electron')) { this.electronService.ipcRenderer.invoke('sendNotification', { header: op.header, message: op.message }).then(() => { }); }
    });
  }

}
