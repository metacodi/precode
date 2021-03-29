import { Injectable, OnDestroy, Injector } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Subscription, Observable, Subject, of, from, interval, BehaviorSubject } from 'rxjs';
import { ToastController, AnimationController, LoadingController } from '@ionic/angular';
import { ToastOptions } from '@ionic/core';
import { catchError, first, tap } from 'rxjs/operators';
import { Plugins, PushNotification } from '@capacitor/core';
import { FCM } from '@capacitor-community/fcm';
import { ElectronService } from 'ngx-electron';
import * as moment from 'moment';

import { AppConfig } from 'src/core/app-config';
import { AbstractModelService, EntityQuery, OrderByPipe } from 'src/core/abstract';
import { AuthService, AuthenticationState } from 'src/core/auth';
import { ApiService, ApiUserWrapperService, BlobService, findRowIndex, ApiSearchClauses } from 'src/core/api';
import { StoragePlugin, DevicePlugin, MediaPlugin } from 'src/core/native';
import { ConsoleService, evalExpr, deepAssign } from 'src/core/util';

import { Notified, NotifiedUser } from './notifications.types';
import { NotificationsSchema } from './notifications.schema';


const { PushNotifications } = Plugins;
const fcm = new FCM();

/**
 * Servicio genérico con doble funcionalidad:
 * - Informa del token del dispositivo del usuario.
 * - Resuelve las notificaciones push del usuario.
 *
 * Para responder a las notificaciones en un servicio o componente del proyecto hay que suscribirse a `executeNotificationSubject`:
 * ```typescript
 * import { NotificationsService, NotifiedUser } from 'src/core/notifications';
 *
 * export class ServiciosService extends AbstractModelService implements OnDestroy {
 *   executeNotificationSubscription: Subscription
 *   constructor(
 *     public push: NotificationsService,
 *   ) {
 *     this.executeNotificationSubscription = this.push.executeNotificationSubject.subscribe(nu => this.executeNotification(nu));
 *   }
 *   ngOnDestroy() {
 *     if (this.executeNotificationSubscription) { this.executeNotificationSubscription.unsubscribe(); }
 *   }
 *
 *   executeNotification(nu: NotifiedUser): void {
 *     const action = nu.notified.action;
 *     if (action === ACCION_NAVIGATE_SERVICIO) {
 *     }
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export abstract class NotificationsService extends AbstractModelService implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /** Token del dispositivo. */
  deviceToken: string;
  /** Indica el estado de actualización del token en la base de dadtos. */
  pendingTokenUpdate = false;

  /** Cache de servicios. */
  cache: EntityQuery;
  /** Notificación en ejecución. */
  mandatoryPending: NotifiedUser;
  /** Fecha de la última consulta. */
  lastAuditTime: string;
  /** Indica si el intervalo de auditoría está en marcha. */
  auditCacheIntervalStarted = false;
  /** @hidden */
  auditCacheIntervalSubscription: Subscription;

  /** Notifica de forma genérica las acciones que hay que ejecutar. */
  executeNotificationSubject: Subject<NotifiedUser> = new Subject<NotifiedUser>();
  /** Notifica la recepción de una notificación. */
  notificationReceivedSubject: Subject<NotifiedUser> = new Subject<NotifiedUser>();
  /** Notifica la recepción de una notificación. */
  newNotificationReceivedSubject: Subject<NotifiedUser> = new Subject<NotifiedUser>();

  /** Contador de notificaciones pendientes de entregar. Se utiliza para mostrarlo los badges de la aplicación. */
  unattendedCount = 0;
  /** Permite informar de la finalización de la ejecución de una notificación obligatoria. */
  mandatoryNotificationCompleted: Subject<boolean> = new Subject<boolean>();
  /** Opciones de personalización de los Toast para cada acción. */
  toastOptions: { [key: number]: ToastOptions } = {};

  /** Refrencia al componente loader. */
  loader: HTMLIonLoadingElement;
  /** Indica si existe una alerta de notificaciones abierta pendiente de responder. */
  alert = false;

  /** Permite notificar al componente de listado que hay que permutar entre ver todas las notificaciones o solo las no atendidas. */
  toggleUnattended: Subject<void> = new Subject<void>();

  /** Blob de configuración. */
  notificationsSettings: any;

  /** @category Dependencies */
  device: DevicePlugin;
  /** @category Dependencies */
  media: MediaPlugin;
  /** @category Dependencies */
  auth: AuthService;
  /** @category Dependencies */
  user: ApiUserWrapperService;
  /** @category Dependencies */
  router: Router;
  /** @category Dependencies */
  console: ConsoleService;
  /** @category Dependencies */
  blob: BlobService;
  /** @category Dependencies */
  storage: StoragePlugin;
  /** @category Dependencies */
  toastController: ToastController;
  /** @category Dependencies */
  loadingCtrl: LoadingController;
  /** @category Dependencies */
  electronService: ElectronService;
  /** @category Dependencies */
  animationCtrl: AnimationController;

  constructor(
    public injector: Injector,
    public api: ApiService,
  ) {
    super(injector, api);
    if (this.debug) { console.log('NotificationsService:' + this.constructor.name + '.constructor()'); }

    /** @category Dependencies */
    this.device = this.injector.get<DevicePlugin>(DevicePlugin);
    /** @category Dependencies */
    this.media = this.injector.get<MediaPlugin>(MediaPlugin);
    /** @category Dependencies */
    this.auth = this.injector.get<AuthService>(AuthService);
    /** @category Dependencies */
    this.user = this.injector.get<ApiUserWrapperService>(ApiUserWrapperService);
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
    this.loadingCtrl = this.injector.get<LoadingController>(LoadingController);
    /** @category Dependencies */
    this.electronService = this.injector.get<ElectronService>(ElectronService);
    /** @category Dependencies */
    this.animationCtrl = this.injector.get<AnimationController>(AnimationController);

    // Creamos una consulta para la cache.
    this.cache = new EntityQuery(NotificationsSchema);

    // Cargamos la configuración de las notificaciones.
    this.blob.get('notificationsSettings').then(behavior => this.subscriptions.push(behavior.subscribe(value => this.notificationsSettings = value)));

    // Monitorizamos la autenticación para detectar el login.
    this.subscriptions.push(this.auth.authenticationChanged.subscribe((value: AuthenticationState) => this.onAuthenticationChanged(value)));

    // Monitorizamos el cambio de token del dispositivo del usuario.
    this.device.ready().then(() => this.onDeviceReady());
  }

  ngOnDestroy(): void {
    this.stopAuditCacheInterval();
    super.ngOnDestroy();
  }


  // ---------------------------------------------------------------------------------------------------
  //  Device token
  // ---------------------------------------------------------------------------------------------------

  protected onDeviceReady() {
    if (this.device.isRealPhone) {
      // Solicitamos los permisos al usuario.
      PushNotifications.requestPermission().then(result => {
        if (result.granted) {
          // Register with Apple / Google to receive push via APNS/FCM
          PushNotifications.register().then(() => { }).catch(err => alert(JSON.stringify(err)));
        } else {
          // TODO: Mostrar un mensaje para sugerir al usuario que debe habilitar el sistema de notificaciones para esta aplicación.
        }
      });
      // Establecemos el token del device.
      fcm.getToken().then(response => this.setDeviceToken(response.token));
    }

    // Recibimos las notificaciones que van llegando en tiempo de ejecución.
    if (this.device.isRealPhone) {
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotification) => this.onPushNotificationReceived(notification));
    }

    // Capturamos los clics sobre las notificaciones del sistema.
    if (this.device.is('electron')) {
      this.electronService.ipcRenderer.on('notificationClick', (event, args) => this.resolveNotificationResponse(args.nu, true));
    }
  }

  protected setDeviceToken(token: string): void {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.setDeviceToken() -> token => ', token); }
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
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.saveDeviceToken()'); }
    this.user.get().pipe(first()).subscribe(user => {
      if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.saveDeviceToken() -> deviceToken => ', this.deviceToken); }
      // Actualizamos el nuevo token del dispositivo en el backend.
      this.api.put(`device?id=${user.device.idreg}`, { deviceToken: this.deviceToken }).pipe(
        tap(response => this.pendingTokenUpdate = false),
        catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))
      );
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  cache
  // ---------------------------------------------------------------------------------------------------

  protected onAuthenticationChanged(value: AuthenticationState): void {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.onAuthenticationChanged() =>', value); }
    if (value.isAuthenticated) {
      // Comprobamos si todavía está pendiente de establecer el token.
      if (this.pendingTokenUpdate) { this.saveDeviceToken(); }
      // Limpiamos la cache.
      this.cache.clear();
      // Cargamos las notificaciones del usuario.
      this.loadCache(true).subscribe(() => {
        // Iniciamos el intervalo de auditoría.
        this.startAuditCacheInterval();
      });

    } else {
      // Detenemos el intervalo de consultas de notificaciones.
      this.stopAuditCacheInterval();
      // Anulamos el bloqueo por notificaciones obligatorias.
      this.mandatoryPending = undefined;
    }
  }

  /** Atendemos la notificación llegada desde el plugin FCM. */
  protected onPushNotificationReceived(notification: PushNotification): void {
    // Comprobamos si el intervalo de auditoría ya la ha obtenido antes y la ha tratado.
    const found = (this.cache.rows as NotifiedUser[]).find(r => r.notified.notification.idreg === notification.data.idNotification);
    if (!found?.notified.attended || found.notified.silent) {
      // Ejecutamos la consulta de auditoría para recibir la notificación correspondiente de la base de datos.
      this.auditCache();
    }
  }

  loadCache(executeQueue?: boolean): Observable<NotifiedUser[]> {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.loadCache()'); }
    const cache = this.cache;
    // Comprobamos si todavía quedan filas por cargar...
    if (cache.completed) { return of([]); }
    // NOTA: Podemos usar este servicio como host (cuando debería ser el componente de listado) pq desde
    // los hooks del esquema se accede a miembros que también están disponibles en este servicio.
    const host = this;
    const itemsPerPage = this.notificationsSettings?.audit.itemsPerPage || 1000;
    // NOTA: Creamos una nueva consulta para no sobrescribir la consulta de la cache.
    const temp = new EntityQuery(NotificationsSchema); temp.page = cache.page;
    // Delegamos en la capa abstracta para realizar una consulta según el esquema.
    return this.getRows(temp, { itemsPerPage, host }).pipe(tap((rows: NotifiedUser[]) => {
      // Añadimos las filas a la cache evitando las repeticiones.
      this.pushRowsAvoidingRepetitions(cache, rows);
      // Actualizamos la página de la consulta.
      cache.page = temp.page;
      cache.completed = temp.completed;
      // Actualizamos la fecha de la última consulta.
      this.lastAuditTime = moment().format('YYYY-MM-DD HH:mm:ss');
      // Contar las desatendidas.
      this.updateUnattendedCount();
      // Ejecutamos la cola por si hay notificaciones nuevas.
      if (executeQueue) { setTimeout(() => this.executeQueue(), 5000); }
    }));
  }

  startAuditCacheInterval(period?: number) {
    if (AppConfig.notifications?.allowIntervalRequest === false) { return; }
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.startAuditCacheInterval()'); }
    if (this.auditCacheIntervalSubscription) { this.auditCacheIntervalSubscription.unsubscribe(); }
    this.auditCacheIntervalStarted = true;
    period = period || this.notificationsSettings?.audit.period || 30;
    this.auditCacheIntervalSubscription = interval(period * 1000).subscribe(() => this.auditCache().subscribe());
    this.auditCache().subscribe();
  }

  stopAuditCacheInterval() {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.stopAuditCacheInterval()'); }
    this.auditCacheIntervalStarted = false;
    if (this.auditCacheIntervalSubscription) { this.auditCacheIntervalSubscription.unsubscribe(); }
  }

  /** Permite modificar el intervalo de auditoría de la cache.
   * Ej: cuando vamos a pagar un servicio reducimos el periodo del intervalo para intensificar la auditoría
   * y así poder recibir antes la notificación de pago.
   */
  set auditCacheIntervalPeriod(seconds: number) {
    this.stopAuditCacheInterval();
    this.startAuditCacheInterval(seconds);
  }

  auditCache(): Observable<NotifiedUser[]> {
    if (this.debug) { console.log('NotificationsService:' + this.constructor.name + '.auditCache()'); }
    // NOTA: Podemos usar este servicio como host (cuando debería ser el componente de listado) pq desde
    // los hooks del esquema se accede a miembros que también están disponibles en este servicio.
    const host = this;
    const cache = this.cache;
    const lastAuditTime = this.lastAuditTime;
    // NOTA: Restamos un minuto a la hora de la auditoria para asegurar que las recibimos todas.
    const period = this.notificationsSettings?.audit.period || 30;
    const nextAuditTime = moment().subtract(60, 'seconds').format('YYYY-MM-DD HH:mm:ss');
    // Creamos una consulta no paginada.
    const paginate = false;
    const search: ApiSearchClauses = {
      AND: [
        ['idUser', '=', host.user.instant?.idreg],
        { OR: [['notified.attended', '>', lastAuditTime], ['notified.notification.created', '>', lastAuditTime]] },
      ]
    };
    // Evitamos las que están fuera de la paginación actual de la cache.
    const limitBeofreDate = cache.rows.length ? cache.rows[cache.rows.length - 1].notified.notification.created : false;
    if (limitBeofreDate) { search.AND.push(['notified.notification.created', '>=', limitBeofreDate]); }
    // NOTA: Creamos una nueva consulta para no sobrescribir la consulta de la cache.
    return this.getRows(new EntityQuery(NotificationsSchema), { search, paginate, host }).pipe(tap((rows: NotifiedUser[]) => {
      // Actualizamos la fecha de la última consulta.
      this.lastAuditTime = nextAuditTime;
      // Comprobamos si ha habido cambios.
      if (rows?.length) {
        // Actualizamos las caches.
        const news = this.refreshCache(rows);
        // Notificamos las nuevas push recibidas.
        news.map(nu => this.newNotificationReceivedSubject.next(nu));
        // Contar las desatendidas.
        this.updateUnattendedCount();
        // Ejecutamos la cola por si hay notificaciones nuevas.
        if (news.length) { this.executeQueue(); }
      }
    }));
  }

  refreshCache(auditRows: NotifiedUser[]): NotifiedUser[] {
    const news: NotifiedUser[] = [];
    if (this.debug) { console.log('NotificationsService:' + this.constructor.name + `.refreshCache(})`); }
    const cache = this.cache;
    // Tratamos cada fila auditada.
    auditRows?.map(audit => {
      // Obtenemos la fila auditada.
      const row = cache.rows.find(r => r.idreg === audit.idreg);
      if (this.debug) { console.log('NotificationsService:' + this.constructor.name + `.refreshCache(}) -> audit => `, { audit, row }); }
      // Comprobamos si está dentro la paginación.
      const outside = false;
      // Actualizamos la cache.
      if (!outside) { const res = this.refreshCacheRow(cache.rows, row, audit); if (res === 'NEW') { news.push(audit); } }
    });
    // Ordenamos la filas.
    const pipe = new OrderByPipe();
    cache.rows = pipe.transform(cache.rows, cache.model.list.orderBy);
    return news;
  }

  refreshCacheRow(rows: NotifiedUser[], row: NotifiedUser, audit: NotifiedUser): 'NEW' | 'UPDATED' | 'DELETED' {
    if (row === undefined) {
      // NEW
      rows.push(audit);
      if (this.debug) { console.log('NotificationsService:' + this.constructor.name + '.refreshCacheRow() -> NEW => ', audit); }
      return 'NEW';

    } else {
      // UPDATED
      deepAssign(row, audit);
      if (this.debug) { console.log('NotificationsService:' + this.constructor.name + '.refreshCacheRow() -> UPDATED => ', row); }
      return 'UPDATED';
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  unattended
  // ---------------------------------------------------------------------------------------------------

  get unattended(): NotifiedUser[] {
    return (this.cache.rows as NotifiedUser[]).filter(nu => !nu.notified.attended);
  }

  protected updateUnattendedCount() {
    // Contar las pendientes de entrega.
    this.unattendedCount = this.unattended.length;
    // TODO: Actualizar el badge de la aplicación a nivel de sistema.
  }


  // ---------------------------------------------------------------------------------------------------
  //  Execute notifications
  // ---------------------------------------------------------------------------------------------------

  /** Comprueba las notificaciones push recibidas. */
  executeQueue(): void {
    // Separamos las silenciosas del resto para ejecutarlas en paralelo.
    const silent = (this.cache.rows as NotifiedUser[]).filter(nu => nu.notified.silent && !nu.notified.attended);
    silent.map(nu => this.executeNotification(nu, { forceAttended: true }));
    // Informamos de las notificaciones recibidas.
    const unprocessed = (this.cache.rows as NotifiedUser[]).filter(nu => !nu.processed);
    unprocessed.map(nu => this.notificationReceivedSubject.next(nu));

    // Si hay una obligatoria pendiente, no hacemos nada.
    if (this.mandatoryPending) { return; }

    // Damos prioridad a las obligatorias no atendidas.
    const mandatory = (this.cache.rows as NotifiedUser[]).filter(nu => nu.notified.mandatory && !nu.notified.attended);
    if (mandatory.length) {
      const nu = mandatory[0];
      this.mandatoryPending = nu;
      // Mostramos un mensaje de alerta en primer plano con un solo botón para aceptar.
      this.alertNotification(nu);
      // Monitorizamos el fin de la acción.
      const sub = this.mandatoryNotificationCompleted.subscribe(attended => {
        sub.unsubscribe();
        if (attended) { this.markAsAttended(nu); } else { this.avoidMamdatory(nu); }
        this.mandatoryPending = undefined;
        this.executeQueue();
      });
      // Ejecutamos la acción
      this.executeNotification(nu);

    } else {
      // Obtenemos las pendientes de entrega.
      const unattended = this.unattended;
      // Si no hay obligatorias, deberemos comprobar la configuración actual del usuario.
      if (!this.user.instant?.device?.notifications.disablePushNotifications) {
        // Si solo hay una la ejecutamos ahora.
        if (unattended.length === 1) {
          const nu = unattended[0];
          // Presentamos un Toast al usuario para que decida si quiere atenderla.
          this.toastNotification(nu).then(response => this.resolveNotificationResponse(nu, response));

        } else if (unattended.length > 1) {
          // Comprobamos que no hay una alerta pendiente de resopnder.
          if (!this.alert && !this.router.url.includes('notificaciones')) {
            // Establecemos el indicador de estado.
            this.alert = true;
            // Si hay un lote de notificaciones pendientes, mostramos un prompt para que el usuario pueda elegir atenderlas.
            this.showAlert({
              header: 'notifications.deseaAtenderlas',
              message: 'notifications.deseaAtenderlasMessage',
              interpolateMessage: { count: unattended.length },
              YesNo: true,
            }).then(response => {
              this.alert = false;
              if (response) { this.navigateToNotifications(); }
            });
          }
        }
      }
    }
  }

  /** Gestiona la respuesta del usuario a la notificación presentada. */
  protected resolveNotificationResponse(nu: NotifiedUser, response: boolean): void {
    if (response) { this.executeNotification(nu, { forceAttended: !nu.notified.needToSolve }); }
    else if (!nu.notified.needToSolve) { this.markAsAttended(nu); }
  }

  /** Ejecuta la acción asociada con la notificación. Antes la marca como atendida si no lo estaba ya. */
  async executeNotification(nu: NotifiedUser, options?: { forceAttended?: boolean }): Promise<any> {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.executeNotification(notified) => ', nu); }
    if (!options) { options = {}; }
    if (options.forceAttended === undefined) { options.forceAttended = false; }

    if (this.loader) { this.loader.dismiss(); this.loader = undefined; }
    if (options.forceAttended) {
      return this.markAsAttended(nu).finally(() => this.executeNotificationSubject.next(nu));
    } else {
      this.executeNotificationSubject.next(nu);
      return of().toPromise();
    }
  }

  /** Presenta la notificación al usuario a través de un componente de alerta. */
  async alertNotification(nu: NotifiedUser): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const op: any = {};
      const header = nu.notified.header || '';
      if (header) { op.header = this.resolveTranslate(header); }
      op.message = '';
      op.buttons = [{
        text: this.translate.instant('buttons.accept'),
        handler: () => resolve(true)
      }];
      this.alertCtrl.create(op).then(alert => alert.present()).catch(error => reject(error));
    });
  }

  /** Presenta la notificación al usuario a través de un componente toast. */
  async toastNotification(nu: NotifiedUser): Promise<boolean> {
    const type = nu.notified.notification.idNotificationType;
    const showYesNo = nu.notified.needToSolve;
    const op: ToastOptions = {
      cssClass: 'toast-custom-class',
      duration: (this.notificationsSettings?.toastDuration || 4) * 1000,
      position: 'top',
      buttons: [{ text: '', icon: 'notifications', side: 'start' }],
    };
    // Sobrescribimos las opciones por defecto con las definidas para este tipo de notificación (desde AppComponent).
    if (Object.keys(this.toastOptions).includes(type.toString())) { deepAssign(op, this.toastOptions[type]); }
    const header = nu.notified.header || '';
    if (header) { op.header = this.resolveTranslate(header); }
    op.message = showYesNo ? this.translate.instant('notificaciones.quiere_atenderla') : '';

    if (this.user.instant.device.notifications.allowSonidoPush && showYesNo) {
      if (!this.media.isPlay) { this.media.play({ src: 'audio/' + this.user.instant.device.notifications.sonidoPush }); }
    }

    // Lanzamos la notificación de sistema por si la aplicación está en segundo plano.
    if (this.device.is('electron')) { this.electronService.ipcRenderer.invoke('sendNotification', { appId: AppConfig.app.package, header: op.header, message: op.message, nu }).then(() => { }); }

    // Lanzamos el Toast.
    return new Promise<boolean>((resolve, reject) => {
      this.toastController.create(op).then((toast) => {
        toast.present();
        // Necesitamos saber cuando se cierra sin aceptar o hacer click en el botón o en el toast.
        const listener: EventListenerOrEventListenerObject = (ev => {
          if (this.debug) { console.log(this.constructor.name + '.ionToastDidDismiss', ev); }
          toast.removeEventListener('ionToastDidDismiss', listener);
          resolve(false);
        });
        toast.addEventListener('ionToastDidDismiss', listener);
        // NOTA: el evento click en el componente Toast solo se lanza cuando pulsa el botón "Sí".
        toast.addEventListener('click', (ev => {
          if (this.debug) { console.log(this.constructor.name + '.click', ev); }
          if (this.media.isPlay) { this.media.stop(); }
          // this.media.stop();
          this.showLoader().then(loader => this.loader = loader).finally(() => {
            toast.removeEventListener('ionToastDidDismiss', listener);
            toast.dismiss();
            resolve(true);
          });
        }));
      });
    });
  }

  /** Indica que la notificación actual ha sido atendida correctamente. */
  async markAsAttended(nu: NotifiedUser): Promise<any> {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.markAsAttended(notified) => ', nu); }
    if (nu.notified.attended) { return of().toPromise(); }
    // Marcamos la notificación como atendida (y tb recibida si todavía no lo estaba).
    const attended = moment().format('YYYY-MM-DD HH:mm:ss');
    const data: any = { idNotified: nu.idNotified, notified: { attended } };
    // Marcamos ahora la notificación localmente sin esperar al callback de backend.
    nu.notified.attended = attended;
    // Realizamos la llamada a backend.
    return this.api.put(`notifiedUser?id=${nu.idreg}&rel=notified`, data).pipe(
      tap(() => this.updateUnattendedCount()),
      catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))
    ).toPromise();
  }

  /** Marca la notificación indicada como solventada. */
  async avoidMamdatory(nu: NotifiedUser): Promise<any> {
    if (this.debug) { this.console.log('NotificationsService:' + this.constructor.name + '.avoidMamdatory(notified) => ', nu); }
    if (!nu.notified.mandatory) { return of().toPromise(); }
    const data: any = { notified: { mandatory: false }, idNotified: nu.idNotified };
    // Marcamos ahora la notificación localmente sin esperar al callback de backend.
    nu.notified.mandatory = false;
    // Realizamos la llamada a backend.
    return this.api.put(`notifiedUser?id=${nu.idreg}&rel=notified`, data).pipe(
      catchError(error => this.alertError({ error, message: 'notifications.errorGeneric', emitError: false }))
    ).toPromise();
  }

  /** Muestra un loader hasta que se termina de ejecutar la notificación. */
  async showLoader(message?: string): Promise<HTMLIonLoadingElement> {
    return this.loadingCtrl.create({
      message: this.translate.instant(message || 'api.updating') + '...',
      duration: 5000,
      spinner: 'circles',
    }).then(loader => {
      loader.present();
      return loader;
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Componente de listado
  // ---------------------------------------------------------------------------------------------------

  /**
   * Navega hacia el componente de listado de notificaciones del proyecto final.
   *
   * Sobrescribir para pasar una ruta diferente.
   * ```typescript
   * this.push.navigateToNotifications = (): Promise<boolean> => this.router.navigate([`/notificaciones`]);
   * ```
   */
  async navigateToNotifications(): Promise<boolean> {
    return this.router.navigate([`/notificaciones`]);
  }


  // ---------------------------------------------------------------------------------------------------
  //  Acciones genéricas
  // ---------------------------------------------------------------------------------------------------

  async navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate(commands, extras);
  }

}
