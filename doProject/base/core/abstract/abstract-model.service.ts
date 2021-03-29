import { Injectable, Injector, OnDestroy } from '@angular/core';
import { FormGroup} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, PopoverController, LoadingController } from '@ionic/angular';
import { Observable, of, Subscription, Subject, Subscriber } from 'rxjs';
import { map, first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { ApiService, ApiEntity, CompareNames, findRowIndex } from 'src/core/api';
import { booleanOrExpr, numberOrExpr, stringOrExpr } from 'src/core/meta';
import { resolveComponentFactory, resolveTranslate, deepAssign, ThemeService, EvalExpressionOptions, evalExpr } from 'src/core/util';

import { AbstractBaseClass } from './abstract-base.class';
import { AbstractListRequestOptions } from './components/abstract-list.component';
import { AbstractListSettings, ListSettingsActionEvent } from './components/abstract-list-settings';
import { EntityName, EntityModel } from './model/entity-model';
import { EntityQuery } from './model/entity-query';
import { EntitySchema, EntityType, EntityListSchema, PickRowOptions, PickRowNotificationType, RowModelType, ConfirmMessage } from './model/entity-schema';
import { EntityCache } from './model/entity-cache';
import { LocalizationService } from '../localization/localization.service';


@Injectable({
  providedIn: 'root'
})
export abstract class AbstractModelService extends AbstractBaseClass implements OnDestroy {

  /** Permite al componente de listado notificar la fila seleccionada por el usuario. */
  static pickRowNotify: Subject<PickRowNotificationType> = new Subject<PickRowNotificationType>();

  protected debug = true && AppConfig.debugEnabled;

  /** Consultas registradas por los componentes de lista en el servicio. */
  queries: EntityQuery[] = [];
  // /** Caché de consultas para las entidades registradas. */
  // cache: { [key: string]: EntityCache } = {};

  /** El componente de listado recibe una orden de búsqueda desde el side-menu. */
  listSettingsAction: Subject<{ action: ListSettingsActionEvent, data?: any }> = new Subject<any>();

  /**
   * Permite que el componente `AbstractDetailComponent` notifique la fila abierta en cada momento a otros componentes.
   *
   * **Usage**
   *
   * Desde un componente de menú queremos condicionar el template según la fila abierta en ese momento.
   * ```typescript
   * export class DetailMenuComponent {
   *
   *   row: any;
   *
   *   constructor(public service: ServiciosService, ... ) {
   *     // Obtenemos la fila abierta en este momento en el componente de detalle.
   *     this.service.detail.subscribe(row => this.row = row);
   *   }
   * }
   * ```
   * @category Subject
   */
  refreshDetail: Subject<number> = new Subject<number>();
  /**
   * Permite comunicar al componete de listado que debe refrescar sus filas.
   *
   * **Usage**
   *
   * Desde un componente externo al módulo se notifica que una fila ha sido eliminada.
   * ```typescript
   * export class SamplePage {
   *   constructor(public externalSrv: ServiciosService, ... ) {}
   *
   *   deleteServicio() {
   *     ...
   *     this.externalSrv.deleted.next(this.servicio);
   *   }
   * }
   * ```
   *
   * ```typescript
   * export interface RowModelType {
   *   row: any;
   *   entity: string | EntityType;
   * }
   * ```
   * @category Subject
   */
  refreshList: Subject<RowModelType> = new Subject<any>();

  /** Referencia a la fila que el componente cargará al iniciarse. */
  preloadedRow: any;

  /**
   * Permite que el componente `AbstractDetailComponent` notifique la fila abierta en cada momento a otros componentes.
   *
   * **Usage**
   *
   * Desde un componente de menú queremos condicionar el template según la fila abierta en ese momento.
   * ```typescript
   * export class DetailMenuComponent {
   *
   *   row: any;
   *
   *   constructor(public service: ServiciosService, ... ) {
   *     // Obtenemos la fila abierta en este momento en el componente de detalle.
   *     this.service.detail.subscribe(row => this.row = row);
   *   }
   * }
   * ```
   * @category Subject
   */
  detail: Subject<any> = new Subject<any>();
  /**
   * Permite notificar entre componentes de diferentes módulos cuando se ha creado una fila.
   *
   * **Usage**
   *
   * Desde un componente externo al módulo se notifica que una fila ha sido creada.
   * ```typescript
   * export class SamplePage {
   *   constructor(public facturasExtSrv: FacturasService, ... ) {}
   *
   *   crearServicio() {
   *     ...
   *     this.facturasExtSrv.created.next(this.servicio);
   *   }
   * }
   * ```
   *
   * ```typescript
   * export interface RowModelType {
   *   row: any;
   *   entity: string | EntityType;
   * }
   * ```
   * @category Subject
   */
  created: Subject<RowModelType> = new Subject<RowModelType>();
  /**
   * Permite notificar entre componentes de diferentes módulos cuando se ha modificado una fila.
   *
   * **Usage**
   *
   * Desde un componente externo al módulo se notifica que una fila ha sido modificada.
   * ```typescript
   * export class PagarFacturaPage {
   *   constructor(public facturasExtSrv: FacturasService) {}
   *
   *   pagar() {
   *     ...
   *     this.facturasExtSrv.modified.next(this.servicio);
   *   }
   * }
   * ```
   *
   * ```typescript
   * export interface RowModelType {
   *   row: any;
   *   entity: string | EntityType;
   * }
   * ```
   * @category Subject
   */
  modified: Subject<RowModelType> = new Subject<RowModelType>();
  /**
   * Permite notificar entre componentes de diferentes módulos cuando se ha eliminado una fila.
   *
   * **Usage**
   *
   * Desde un componente externo al módulo se notifica que una fila ha sido eliminada.
   * ```typescript
   * export class SamplePage {
   *   constructor(public externalSrv: ServiciosService, ... ) {}
   *
   *   deleteServicio() {
   *     ...
   *     this.externalSrv.deleted.next(this.servicio);
   *   }
   * }
   * ```
   *
   * ```typescript
   * export interface RowModelType {
   *   row: any;
   *   entity: string | EntityType;
   * }
   * ```
   * @category Subject
   */
  deleted: Subject<RowModelType> = new Subject<RowModelType>();

  /**
   * Permite notificar cuando se activa o desactiva un modo de selección lateral en un AbstractListComponent.
   *
   * Los modos de selección múltiple se declaran en el modelo a través de la propiedad {@link multiSelectModes}.
   * Podemos encontrar una implementación de los modos en la clase {@link AbstractListComponent}.
   *
   * **Usage**
   *
   * Desde un componente de menú se inicia un nuevo modo de selección múltiple.
   * ```html
   * <ion-item (click)="servicios.multiSelectModeChanged.next({ name: 'facturar', value: true });">
   * ```
   *
   * Desde un componente de página se recibe la notificación para actualizar una variable del template.
   * ```typescript
   * export class ServiciosListPage implements OnInit, OnDestroy {
   *   isMultiSelectMode = false;
   *   constructor(public service: ServiciosService, ... ) {}
   *
   *   ngOnInit() {
   *     ...
   *     this.service.multiSelectModeChanged.subscribe((data: any) => {
   *       this.isMultiSelectMode = data.value;
   *     });
   *   }
   * }
   * ```
   * @category Subject
   */
  multiSelectModeChanged: Subject<any> = new Subject<any>();

  /** Subscribers correspondientes a observables que habrá que completar al destruir el componente. */
  subscribers: Subscriber<any>[] = [];
  /** Subscriptores de los que habrá que desubscribirse al destruir el componente. */
  subscriptions: Subscription[] = [];

  /** @category Dependencies */ loadCtrl: LoadingController;
  /** @category Dependencies */ modal: ModalController;
  /** @category Dependencies */ popover: PopoverController;
  /** @category Dependencies */ alertCtrl: AlertController;
  /** @category Dependencies */ router: Router;
  /** @category Dependencies */ route: ActivatedRoute;
  /** @category Dependencies */ theme: ThemeService;

  constructor(
    /** @category Dependencies */ public injector: Injector,
    /** @category Dependencies */ public api: ApiService,
  ) {
    super(injector);
    if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.constructor()'); }

    // this.translate = this.injector.get<TranslateService>(TranslateService);
    this.loadCtrl = this.injector.get<LoadingController>(LoadingController);
    this.modal = this.injector.get<ModalController>(ModalController);
    this.popover = this.injector.get<PopoverController>(PopoverController);
    this.alertCtrl = this.injector.get<AlertController>(AlertController);
    this.router = this.injector.get<Router>(Router);
    this.route = this.injector.get<ActivatedRoute>(ActivatedRoute);
    this.theme = this.injector.get<ThemeService>(ThemeService);

  }

  /** @category Lifecycle */
  ngOnDestroy(): void {
    if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.ngOnDestroy()'); }
    // Completamos y cancelamos las suscripciones.
    if (this.subscribers?.length) { this.subscribers.map(sub => sub.complete()); }
    if (this.subscriptions?.length) { this.subscriptions.map(sub => sub.unsubscribe()); }
  }

  /** Referencia a la configuración por defecto del componente de listado asociado con el srevicio. */
  defaultListSettings(key: string): AbstractListSettings { return; }


  // ---------------------------------------------------------------------------------------------------
  //  queries
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene una consulta para el componente de lista o detalle. Si no existe crea una nueva. */
  registerQuery(model: EntitySchema | EntityModel, queryKey?: string): EntityQuery {
    // Obtenemos una instancia del modelo.
    if (!(model instanceof EntityModel)) { model = new EntityModel(model, this.translate); }
    // Obtenemos las consultas registradas a partir de la clave o el modelo.
    const queries = this.findQueries(queryKey || model, { throwError: false });
    // Comprobamos si existe una consulta para la clave o el modelo indicados.
    if (queries.length) {
      // Devolvemos la consulta existente.
      const query = queries[0];
      if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.registerQuery() -> existing => ', { queryKey, query }); }
      return query;

    } else {
      // Creamos una nueva consulta para la clave o el modelo indicados.
      const query = new EntityQuery(model as EntityModel, queryKey);
      // Si requiere el uso de una caché creamos una ahora.
      if (model.list.cache) { query.cache = new EntityCache(query, this.api); }
      // Añadimos la consulta a la colección.
      this.queries.push(query);
      if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.registerQuery() -> created => ', { queryKey, query }); }
      return query;
    }
  }

  /** Devuelve la consulta a partir de su clave o bien las consultas que coinciden con el nombre del modelo o el esquema indicados. */
  findQueries(keyOrEntity: string | EntityType, options?: { compare?: CompareNames, throwError?: boolean }): EntityQuery[] {
    if (!options) { options = {}; }
    if (options.compare === undefined) { options.compare = 'Optimistic'; }
    if (options.throwError === undefined) { options.throwError = true; }
    // Buscamos entre las consultas por su nombre.
    if (keyOrEntity instanceof EntityQuery) { return [keyOrEntity]; }
    const queries = this.queries.filter(q => typeof keyOrEntity === 'string' ? q.key === keyOrEntity : EntityName.equals(q, keyOrEntity));
    if (queries.length > 0 || !options.throwError) { return queries; }
    // Obtenemos el nombre para informar del error.
    const name: EntityName = typeof keyOrEntity === 'string' ? { singular: keyOrEntity, plural: keyOrEntity } : EntityName.resolve(keyOrEntity, this.translate);
    throw new Error(`No existe ninguna consulta para la entitdad '${name.plural}' en el servicio '${this.constructor.name}'.`);
  }


  // ---------------------------------------------------------------------------------------------------
  //  List
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene las filas de la página actual.
   * ```typescript
   * interface AbstractListRequestOptions { host?: any; search?: EntityListSchema['search']; event?: any; clearBefore?: boolean; }
   * ```
   * @param host Referencia al componente heredado de _AbstractListComponent_.
   * @param event: evento disparado por el componente `ion-infinite-scroll`.
   */
  request(query: EntityQuery, options?: AbstractListRequestOptions): Promise<any[]> {
    // Obtenemos la consulta a partir del nombre de la entidad.
    const list: EntityListSchema = query.model.list;
    if (!options) { options = {}; }
    const host = options.host;
    const event = options.event || false;
    const search = options.search || null;
    const clearBefore = options.clearBefore === undefined ? false : options.clearBefore;

    if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.request(event) => ', { query, options }); }
    return new Promise<any[]>(resolve => {
      // Solo eliminamos las filas pero conservamos la paginación actual (a diferencia de la llamada a query.clear() que la inicializa a 0)
      if (clearBefore) { query.rows = []; if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.request() -> clearBefore()', query); } }
      // Si es la primera carga, inicializamos la colección.
      if (!event) { query.clear(); if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.request() -> query.clear()', query); } }
      // Solicitamos las filas de la página atual.
      this.getRows(query, { host, search }).pipe(first()).subscribe(rows => {
        // Referenciamos el componente ion-infinite-scroll
        // if (event?.target instanceof IonInfiniteScroll) { query.infinite = event.target; }
        if (event?.target) { query.infinite = event.target; }
        // Damos el evento de ion-infinite-scroll por completado.
        if (query.infinite) { query.infinite.complete(); }
        // Comprobamos si hay que deshabilitarlo.
        if (query.infinite && query.completed) { query.infinite.disabled = true; }
        resolve(rows);
      });
    });
  }

  getRows(query: EntityQuery, options?: { host?: any, search?: EntityListSchema['search'], paginate?: boolean, itemsPerPage?: number, customFields?: string, showLoader?: boolean }): Observable<any[]> {
    // Obtenemos la consulta a partir del nombre de la entidad.
    const list: EntityListSchema = query.model.list;
    if (options === undefined) { options = {}; }
    if (options.paginate === undefined) { options.paginate = list.paginate; }
    if (options.itemsPerPage === undefined) { options.itemsPerPage = list.itemsPerPage; }
    if (options.showLoader === undefined) { options.showLoader = list.showLoader; }

    // Comprobamos si ya se han cargado todas las filas.
    if (query.completed) {
      if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.getRows() -> of(query.rows) => ', query.rows); }
      // tslint:disable-next-line: deprecation
      return of(query.rows);
    }
    // Caché no disponible
    return new Observable<any[]>(observer => {
      // Elegimos el método.
      const method = options.search || list.search ? 'POST' : 'GET';
      // Obtenemos la url base.
      query.resolveUrl(options).then(url => {
        // Obtenemos las condiciones.
        EntityModel.resolveAsyncValue(options.search || list.search, options.host).pipe(first()).subscribe(search => {
          // Referenciamos el cuerpo de la consulta.
          const body = search || null;
          // Obtenemos las filas del backend.
          if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.getRows() -> api.request(' + method + ') -> body =', body); }
          this.api.request(method, url, { body, showLoader: options.showLoader }).pipe(first()).subscribe(
            data => {
              if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.getRows -> api.request(' + method + ').subscribe(data) => ', data); }
              if (options.paginate) {
                // Actualizamos la paginación.
                query.page = query.completed ? 0 : +query.page + 1;
                if (data && data.length < options.itemsPerPage) { query.completed = true; }
              } else {
                // Si no es una operación paginada vaciamos el array.
                query.clear();
              }
              if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.getRows -> api.request(' + method + ') -> query.page => ', query.page); }

              // Si nos han llegado resultados...
              if (data && data.length) {
                // Ofrecemos las filas obtenidas para su edición.
                EntityModel.resolveRowHook(list.opening, data, options.host).pipe(first()).subscribe(open => {
                  // Mapeamos los resultados.
                  EntityModel.resolveRowHook(list.map, open, options.host).pipe(first()).subscribe((rows: any[]) => {
                    // Cargamos las filas mapeadas al final de la lista.
                    query.rows.push(...rows);
                    // Notificamos los resultados a través del observable.
                    observer.next(query.rows);
                    observer.complete();
                  });
                });

              } else {
                // Devolvemos las mismas filas que ya había.
                observer.next(query.rows);
                observer.complete();
              }

            }, error => {
              if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.getRows.subscribe(error) => ', error); }
              // query.rows = null
              observer.next(null);
              observer.complete();
            }
          );
        });
      }).catch(error => { observer.next(null); observer.complete(); });
    });
  }

  /** Añade las filas obtenidas de la siguiente página a la consulta actual evitando las repeticiones. */
  pushRowsAvoidingRepetitions(query: EntityQuery, rows: any[], options?: { checkAlways?: boolean }) {
    if (!options) { options = {}; }
    if (options.checkAlways === undefined) { options.checkAlways = false; }
    // Al principio damos por hecho que hay repeticiones que comprobar.
    let checkRepeated = true;
    // NOTA: Tanto la query como las filas obtenidas de la siguiente página están ordenadas de la misma manera.
    rows?.map(row => {
      // Si se requiere, buscamos si la fila ya existe.
      const found = checkRepeated && query.rows.find(r => r.idreg === row.idreg);
      // Si no existe...
      if (!found) {
        // Añadimos la fila de la página a la consulta actual.
        query.rows.push(row);
        // Como están ordenadas, podemos garantizar que el resto de filas ya no estarán repetidas.
        if (!options.checkAlways) { checkRepeated = false; }
      }
    });
  }

  /** Elimina las filas de la caché y restablece las paginaciones de todas las consultas. */
  clearCache(): Promise<any> {
    // Devolvemos una promise que se resuelve inmediatamente para poder usarla en un forkJoin()
    return new Promise<any>(resolve => {
      if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.clearCache()'); }
      // Iteramos los queries almacenados.
      for (const query of this.queries) {
        // Limpiamos la colección de la caché para forzar la carga desde el backend durante la próxima llamada.
        query.clear();
      }
      resolve(true);
    });
  }

  /**
   * Muestra el componente de lista en diferentes modos para poder seleccionar una fila o valor.
   *
   * ```typescript
   * this.service.pickRow({
   *   mode: 'modal',
   *   component: MisDireccionesListComponent,
   *   selected,
   *   canCreate: true,
   * }).then(row => {
   *   if (row) { ... }
   * });
   * ```
   */
  pickRow(options: PickRowOptions): Promise<any> {
    if (!options) { options = {}; }
    if (options.mode === undefined) { options.mode = 'modal'; }
    if (options.selected === undefined) { options.selected = null; }
    if (options.canCreate === undefined) { options.canCreate = false; }
    if (options.initialize === undefined) { options.initialize = {}; }
    const selected = options.selected;
    const filter = options.filter;
    const canCreate = options.canCreate;
    const initialize = options.initialize;
    const cssClass = options.cssClass;

    return new Promise<any>((resolve: any, reject: any) => {

      if (options.mode === 'modal') {
        // Creamos el modal.
        const component = options.component;
        const componentProps = { initializePickRow: deepAssign({ selected, filter, canCreate, isModal: true }, { initialize }) };
        this.modal.create({ component, componentProps, cssClass }).then(modal => {
          // Nos suscribimos para recibir la notificación por parte del componente de lista.
          const subscripion: Subscription = AbstractModelService.pickRowNotify.subscribe((data: PickRowNotificationType) => {
            // Cerramos la suscripción una vez recibida la primera notificación.
            subscripion.unsubscribe();
            // Resolvemos el resultado obtenido del componente de lista.
            this.resolvePickRow(data, options).then(row => resolve(row)).catch(error => reject(error));
          });
          modal.onDidDismiss().then(() => this.theme.checkStatusBar());
          modal.present();
        }).catch(error => reject(error));

      } else if (options.mode === 'navigation') {
        // Depuramos la ruta.
        const route = Array.isArray(options.route) ? options.route : [options.route];
        // Navegamos hacia el componente de lista.
        this.router.navigate(route, { queryParams: deepAssign({ pickRowNotify: true, selected, filter, canCreate }, { initialize }) });
        // Nos suscribimos para recibir la notificación por parte del componente de lista.
        const subscripion: Subscription = AbstractModelService.pickRowNotify.subscribe((data: PickRowNotificationType) => {
          // Cerramos la suscripción una vez recibida la primera notificación.
          subscripion.unsubscribe();
          // Resolvemos el resultado obtenido del componente de lista.
          this.resolvePickRow(data, options).then(row => resolve(row)).catch(error => reject(error));
        });

      } else if (options.mode === 'popover') {
        // Creamos el popover.
        const component = options.component;
        const componentProps = { initializePickRow: deepAssign({ selected, filter, canCreate, isPopover: true }, { initialize }) };
        this.popover.create({ component, componentProps, cssClass }).then(popover => {
          // Nos suscribimos para recibir la notificación por parte del componente de lista.
          const subscripion: Subscription = AbstractModelService.pickRowNotify.subscribe((data: PickRowNotificationType) => {
            // Cerramos la suscripción una vez recibida la primera notificación.
            subscripion.unsubscribe();
            // Resolvemos el resultado obtenido del componente de lista.
            this.resolvePickRow(data, options).then(row => resolve(row)).catch(error => reject(error));
          });
          popover.onDidDismiss().then(() => this.theme.checkStatusBar());
          popover.present();
        }).catch(error => reject(error));

      } else {
        resolve();
      }
    });
  }
  /** @hidden Resuelve el resultado obtenido del componente de lista. */
  protected resolvePickRow(data: PickRowNotificationType, options: PickRowOptions): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      // Si ha elegido crear una nueva fila...
      if (data?.row[data.model.primaryKey] === 'new') {
        // Resolvemos la ruta para ir a la ficha de detalle.
        data.model.resolveRoute(data.model.detail.route, data.row, this).pipe(first()).subscribe((route: any) => {
          if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.resolvePickRow() -> resolveRoute() => ', route); }
          // Añadimos los parámetros adicionales.
          const queryParams = deepAssign({ pickRowNotify: true }, options.params || {});
          // Navegamos hacia la ruta obtenida y tras finalizar restablecemos el indicador de precarga.
          this.router.navigate(route, { queryParams });
          // Nos suscribimos para recibir la notificación por parte del componente de detalle.
          const subscripion: Subscription = AbstractModelService.pickRowNotify.pipe(first()).subscribe((response: PickRowNotificationType) => {
            // Cerramos la suscripción una vez recibida la primera notificación.
            subscripion.unsubscribe();
            // Devolvemos el resultado del componente de detalle.
            resolve(response?.row);
          });
        });
      } else {
        // Devolvemos el resultado del componente de lista.
        resolve(data?.row);
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Detail
  // ---------------------------------------------------------------------------------------------------

  /**
   * Realiza la precarga de una fila y navega a posteriori. Si no se establece una consulta se registra una nueva.
   *
   * ```typescript
   * this.service.preloadRow(MiPerfilDetailSchema, this.user.instant.idreg, { navigate: '/mi-perfil/detail', parent: this, preloading: 'detail' });
   * ```
   * ```typescript
   * this.preloading = 'detail';
   * this.service.preloadRow(MiPerfilDetailSchema, this.user.instant.idreg, { navigate: '/mi-perfil/detail' }).then(() => {
   *   this.preloading = false;
   * });
   * ```
   */
  preloadRow(query: EntitySchema | EntityModel | EntityQuery, id: number | 'new', options?: { navigate?: string, parent?: any, preloading?: string, paginate?: boolean; showLoader?: boolean }): Promise<any> {
    if (!options) { options = {}; }
    if (options.paginate === undefined) { options.paginate = false; }
    if (options.showLoader === undefined) { options.showLoader = false; }
    if (!(query instanceof EntityQuery)) { query = this.registerQuery(query); }
    if (options.parent) {
      if (options.preloading === undefined) { options.preloading = (query as EntityQuery).model.name.plural; }
      options.parent.preloading = options.preloading;
    }
    return new Promise<any>((resolve: any, reject: any) => {
      this.getRow(query as EntityQuery, id, { paginate: options.paginate, showLoader: options.showLoader }).subscribe(row => {
        this.preloadedRow = row;
        if (options.parent) { options.parent.preloading = false; }
        if (options.navigate) { this.router.navigate([options.navigate]).finally(() => resolve(row)); } else { resolve(row); }
      }, error => reject(error));
    });
    // return this.getRow(query as EntityQuery, id, { paginate: options.paginate, showLoader: options.showLoader }).pipe(tap(row => {
    //   this.preloadedRow = row;
    //   if (options.navigate) { this.router.navigate([options.navigate]); }
    //   if (options.parent) { options.parent.preloading = false; }
    // })).toPromise();
  }

  getRow(query: EntityQuery, id: number | 'new', options?: { host?: any, paginate?: boolean, customFields?: string, showLoader?: boolean }): Observable<any> {
    // Obtenemos la consulta a partir de la clave inequívoca o de la consulta.
    const entityName: string = EntityName.resolve(query.model.backend).singular;
    const primaryKey: string = query.model.primaryKey;
    if (!options) { options = {}; }
    if (options.paginate === undefined) { options.paginate = false; }
    if (options.showLoader === undefined) { options.showLoader = query.model.detail.showLoader; }

    if (id === 'new') {
      // Generamos una nueva fila.
      const row = { [primaryKey]: id };
      // tslint:disable-next-line: deprecation
      if (this.debug) { console.log(`AbstractModelService:${this.constructor.name}.getRow() -> of({ id }) => `, of(row)); }
      // tslint:disable-next-line: deprecation
      return of(row);
    }
    // Comprobamos si hay que tomar la fila de la caché o ir a buscarla al backend.
    if (query.model.detail.cache) {
      if (this.debug) { console.log(`AbstractModelService:${this.constructor.name}.getRow() -> from caché`); }
      // Si es de la caché no puede ser un valor nulo.
      if (!id) { throw new Error(`No se ha suministrado un id para localizar la fila en la caché de la entidad '${entityName}'.`); }
      // Establecemos paginate = false para llenar la caché con todas las filas antes de buscar.
      options.paginate = false;
      // Obtenemos las filas de la caché o el backend.
      return this.getRows(query, options).pipe(first(),
        // Mapeamos el array para filtrar las filas deseadas.
        map((rows: any[]) => {
          // if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.map(rows) => ', rows); }
          if (!rows) { return null; }
          // Buscamos la fila por su clave primaria.
          const matched = rows.find(row => row[primaryKey] === +id);
          // Intentamos devolver la fila directamente y no un array con ella dentro.
          const result = Array.isArray(matched) && matched.length === 1 ? matched[0] : matched;
          if (this.debug) { console.log(`AbstractModelService:${this.constructor.name}.map().find(${id}) => `, result); }
          return result;
        })
      );

    } else {
      if (this.debug) { console.log(`AbstractModelService:${this.constructor.name}.getRow() -> api.get(${entityName}?id=${id})`); }
      return new Observable<any>(observer => {
        // Obtenemos la fila del backend.
        const foreign = query.model.detail.foreign;
        const fields = options.customFields || query.model.detail.fields;
        // Obtenemos la url.
        EntityModel.resolveUrl({ entityName, id, foreign, fields, host: options.host }).then(url => {
          // Obtenemos la fila del backend.
          this.api.get(url, { showLoader: options.showLoader }).subscribe(row => {
            observer.next(row);
            observer.complete();

          }, error => observer.error(error));
        }).catch(error => observer.error(error));
      });
    }
  }

  saveRow(query: EntityQuery, data: object | FormGroup, options?: { host?: any, showLoader?: boolean }): Observable<any> {
    // Obtenemos la consulta a partir de la clave inequívoca o de la consulta.
    const entityName: string = EntityName.resolve(query.model.backend).singular;
    const primaryKey: string = query.model.primaryKey;
    const id = !data.hasOwnProperty(primaryKey) || data[primaryKey] === 'new' ? undefined : data[primaryKey];
    const foreign = query.model.detail.foreign;
    const fields = query.model.detail.fields;
    if (!options) { options = {}; }
    if (options.showLoader === undefined) { options = { showLoader: false }; }
    return new Observable<any>(observer => {
      // Obtenemos la url.
      EntityModel.resolveUrl({ entityName, id, foreign, fields, host: options.host }).then(url => {
        // Comprobamos si es un registro nuevo...
        if (!data.hasOwnProperty(primaryKey) || data[primaryKey] === 'new') {
          if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.saveRow() CREATE -> ', data); }
          // Quitamos el identificador de registro.
          delete data[primaryKey];
          // CREATE
          this.api.post(url, data).pipe(first()).subscribe(created => {
            // Insertamos la fila en la caché.
            if (query.model.detail.updateCacheRow) {
              this.insertCacheRow(query, created, { host: options.host }).finally(() => { observer.next(created); observer.complete(); });
            } else {
              observer.next(created); observer.complete();
            }
          }, error => observer.error(error));

        } else {
          if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.saveRow() UPDATE -> ', data); }

          // UPDATE
          this.api.put(url, data).pipe(first()).subscribe(updated => {
            // Actualizamos la fila de la caché.
            if (query.model.detail.updateCacheRow) {
              this.updateCacheRow(query, updated, { host: options.host }).finally(() => { observer.next(updated); observer.complete(); });
            } else {
              observer.next(updated); observer.complete();
            }
          }, error => observer.error(error));
        }

      }).catch(error => observer.error(error));

    });
  }

  insertCacheRow(query: EntityQuery, created: any, options?: { host?: any }): Promise<any> {
    const entityName: string = EntityName.resolve(query.model.backend).singular;
    const primaryKey: string = query.model.primaryKey;
    const foreign = query.model.list.foreign;
    const fields = query.model.list.fields;
    return new Promise<any>((resolve: any, reject: any) => {
      // NOTA: Si todavía quedan páginas por cargar e insertamos ahora el nuevo elemento
      // se puede dar el caso que aparezca duplicado tras recibirlo en las páginas que faltan.
      if (query.page && !query.completed) {
        if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.insertCacheRow() CREATE -> Limpiamos colección ', {page: query.page}); }
        // Limpiamos la colección para evitar duplicados y cargamos la primera página de nuevo.
        query.clear(); this.request(query, { host: options.host });
        resolve(false);

      } else {
        // Obtenemos la url
        query.resolveUrl({ entityName, id: created[primaryKey], host: options.host }).then(url => {
          // Obtenemos la fila para la lista.
          this.api.get(url, {showLoader: false}).pipe(first()).subscribe(row => {
            if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.insertCacheRow() CREATE -> Obtenemos fila del backend ', {row}); }
            // Comprobamos si es un array...
            if (Array.isArray(row)) {
              // Debería llegar una única fila.
              if (row.length !== 1) { console.error(`No se esperaba obtener del backend un array con ${row.length} fila(s)`); }
              // Referenciamos la fila.
              row = row[0];
            }
            // Mapeamos la fila igual como se haría desde getRows para el componente de listado.
            EntityModel.resolveRowHook(query.model.list.map, row, options.host).pipe(first()).subscribe((maped: any) => {
              // Añadimos la nueva fila al final de la colección.
              query.rows.push(maped);
              if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.insertCacheRow() CREATE -> Fila mapeada ', { row, maped }); }
              // Devolvemos la fila creada.
              resolve(true);

            }, error => resolve(false));
          }, error => resolve(false));
        }).catch(error => resolve(false));
      }
    });
  }

  updateCacheRow(query: EntityQuery, updated: any, options?: { host?: any }): Promise<any> {
    const entityName: string = EntityName.resolve(query.model.backend).singular;
    const primaryKey: string = query.model.primaryKey;
    return new Promise<any>((resolve: any, reject: any) => {
      // Buscamos la fila en la lista de la caché.
      const current = query.rows.find(row => +row[primaryKey] === +updated[primaryKey]);
      if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.updateCacheRow() UPDATE -> Actualizamos la fila de la lista en caché.', {rows: query.rows, find: query.rows.find(row => +row[primaryKey] === +updated[primaryKey]), current, updated}); }
      // Si hay una fila en caché...
      if (current) {
        // Obtenemos la url
        query.resolveUrl({ entityName, id: updated[primaryKey], host: options.host }).then(url => {
          // Obtenemos la fila para la lista.
          this.api.get(url, {showLoader: false}).pipe(first()).subscribe(row => {
            if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.updateCacheRow() UPDATE -> Obtenemos fila del backend ', {row}); }
            // Comprobamos si es un array...
            if (Array.isArray(row)) {
              // Debería llegar una única fila.
              if (row.length !== 1) { console.error(`No se esperaba obtener del backend un array con ${row.length} fila(s)`); }
              // Referenciamos la fila.
              row = row[0];
            }
            // Mapeamos la fila igual como se haría desde getRows para el componente de listado.
            EntityModel.resolveRowHook(query.model.list.map, row, options.host).pipe(first()).subscribe((maped: any) => {
              // Actualizamos los cambios en la caché.
              Object.assign(current, maped);
              // Propagamos los cambios a las entidades hijas.
              const entities = query.model.detail.propagateChanges;
              this.propagateChanges(entities, query, current, { host: options.host });
              if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.updateCacheRow() UPDATE -> Fila mapeada ', { current, maped }); }
              // Devolvemos la fila actualizada.
              resolve(true);

            }, error => resolve(false));
          }, error => resolve(false));
        }).catch(error => resolve(false));

      } else {
        // Devolvemos la fila actualizada.
        resolve(false);
      }
    });
  }

  protected propagateChanges(entities: string | EntitySchema | (string | EntitySchema)[], parentQuery: EntityQuery, parentRow: any, options?: { host?: any }): void {
    // Transmitimos los cambios de la fila a sus filas hijas.
    if (entities) {
      // if (this.debug) { console.log(' AbstractDetailComponent.propagateChanges(entities) => ', entities); }

      // Propagamos a las entidades hijas.
      const entitiesArray: (string | EntitySchema)[] = Array.isArray(entities) ? entities : [entities];
      // Ej: parentQuery = 'roles' => ['usuarios', 'perms']
      for (const entity of entitiesArray) {
        // Obtenemos la query hija actual.
        for (const query of this.findQueries(entity)) {
          // Si hay filas en la entidad hija...
          if (query.rows && query.rows.length > 0 && query.model.list.foreign) {
            // Ej: foreign: { id_role: { role: 'nombre'}, ... }
            const foreigns = query.model.list.foreign;
            // Ej: foreignKey = 'id_role'
            Object.keys(foreigns).map(foreignKey => {
              // Ej: foreign = { role: 'nombre'}
              const foreign = foreigns[foreignKey];
              // Ej:foreignEntity =  'role'
              const foreignEntity = Object.keys(foreign)[0];
              if (EntityName.equals(parentQuery.name, foreignEntity)) {
                // Ej: 'nombre'
                const parentDisplay: any = Object.values(foreign)[0];
                // // Obtenemos el valor de la descripción para la clave foránea.
                EntityModel.resolveAsyncProperty(parentRow, parentDisplay, options.host).pipe(first()).subscribe((display: any) => {
                  const parentName = parentQuery.name;
                  const parentEntity = new ApiEntity(parentQuery.name.plural);
                  const entityName = EntityName.resolve(entity);
                  if (!query) { throw new Error(`No se ha encontrado la entidad '${entityName.plural}' suministrada para propagar los cambios de '${parentName.singular}'.`); }
                  // Preparamos los nombres de las columnas afectadas.
                  const propDisplay = typeof parentDisplay === 'string' ? parentDisplay : parentName.singular;
                  const primaryKey = parentQuery.model.primaryKey;
                  if (this.debug) { console.log('propagateChanges() -> ', { query, parentName, parentEntity, entityName, foreignKey, propDisplay, primaryKey }); }
                  // Obtenemos la info de las filas hijas.
                  let foreignDisplay = '';
                  const childRef = query.rows[0];
                  // Comprobamos si la información del padre aparece como un objeto o bien ha sido desagrupada (flat).
                  if (childRef.hasOwnProperty(parentName.singular) && typeof childRef[parentName.singular] === 'object') {
                    // Ej: festivo.tarifa = { descripcion: 'T-1' }
                    foreignDisplay = parentName.singular;

                  } else if (childRef.hasOwnProperty(parentName.plural) && typeof childRef[parentName.plural] === 'object') {
                    // Ej: festivo.tarifas = { descripcion: 'T-1' }
                    foreignDisplay = parentName.plural;

                  } else if (childRef.hasOwnProperty(parentEntity.table.aliasOrName) && typeof childRef[parentEntity.table.aliasOrName] === 'object') {
                    // Ej: precio_tarifa.origen = { nombre: 'Barcelona' }
                    foreignDisplay = parentEntity.table.aliasOrName;

                  }
                  // Iteramos las filas para actualizar la información foránea (de su padre).
                  query.rows.map((child: any) => {
                    // Tiene la clave foránea.
                    if (child.hasOwnProperty(foreignKey)) {
                      // Comprobamos que se trata de su hija.
                      if (child[foreignKey] === parentRow[primaryKey]) {
                        if (foreignDisplay) {
                          // Es un objeto...
                          if (!child[foreignDisplay]) { child[foreignDisplay] = {}; }
                          child[foreignDisplay][propDisplay] = display;
                          if (this.debug) { console.log(`propagateChanges() -> child['${foreignDisplay}']['${propDisplay}'] =`, display); }
                        } else {
                          // Ej: festivo.tarifa = 'T-1'
                          child[parentName.singular] = display;
                          if (this.debug) { console.log(`propagateChanges() -> child['${parentName.singular}'] =`, display); }
                        }
                      }

                    } else if (foreignDisplay) {
                      // Comprobamos que tenga una clave primaria para comparar
                      if (!child[foreignDisplay].hasOwnProperty(primaryKey)) { throw new Error(`No se ha encontrado la clave primaria '${primaryKey}' en la fila padre incrustada '${foreignDisplay}' para poder propagar los cambios en las filas hijas de '${query.name.plural}'.`); }
                      // Comprobamos que se trate de su hijo
                      if (child[foreignDisplay][primaryKey] === parentRow[primaryKey]) {
                        // Es un objeto...
                        if (!child[foreignDisplay]) { child[foreignDisplay] = {}; }
                        child[foreignDisplay][propDisplay] = display;
                        if (this.debug) { console.log(`propagateChanges() -> child['${foreignDisplay}']['${propDisplay}'] =`, display); }
                      }

                    } else {
                      // No podemos propagar los cambios a esta entidad hija.
                      throw new Error(`Error propagando cambios desde la fila padre '${parentName.singular}': las filas hijas de la entidad '${query.name.plural}' no tienen la columna '${foreignKey}' con la clave foránea.`);
                      // console.log(`propagateChanges() -> no child -> `, { 'child[foreignKey]': child[foreignKey], 'parentRow[primaryKey]': parentRow[primaryKey], child, parentRow, foreignKey, primaryKey });
                    }
                    return child;
                  });
                });
              }
            });
          }
        }
      }
    }
  }

  deleteRow(query: EntityQuery, data: object | FormGroup, options?: { host?: any }): Observable<boolean> {
    // Comprobamos si hay que preguntar al usuario antes de borrar la fila.
    if (!(query.model.detail.confirmDelete as ConfirmMessage).confirm) {
      // Vamos directos a eliminar la fila al backend.
      return this.removeRow(query, data, { host: options.host });

    } else {
      // Pedimos confirmación antes de eliminar.
      return new Observable<boolean>(observer => {
        const confirm: any = query.model.detail.confirmDelete;

        this.showAlert({
          header: confirm.header,
          message: confirm.message,
          YesNo: true,
        }).then(response => {
          if (response) {
            if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.deleteRow() => Yes'); }
            // Procedemos con la eliminación de la fila.
            this.removeRow(query, data, { host: options.host }).pipe(first()).subscribe(result => observer.next(result), error => observer.error(error), () => observer.complete());

          } else {
            if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.deleteRow() => No'); }
            observer.next(false);
            observer.complete();
          }
        });
      });
    }
  }

  removeRow(query: EntityQuery, data: object | FormGroup, options?: { host?: any }): Observable<boolean> {
    // Obtenemos la consulta a partir del nombre de la entidad.
    const entityName: string = EntityName.resolve(query.model.backend).singular;
    const primaryKey: string = query.model.primaryKey;

    return new Observable<boolean>(observer => {
      // Procedemos con la eliminación de la fila.
      this.api.delete(`${entityName}?id=${data[primaryKey]}`).pipe(first()).subscribe(() => {
        // Quitamos la fila de la caché.
        this.deleteCacheRow(query, data, { host: options.host }).finally(() => { observer.next(true); observer.complete(); });

      }, error => observer.error(error));
    });
  }

  protected deleteCacheRow(query: EntityQuery, data: object | FormGroup, options?: { host?: any }): Promise<any> {
    if (!query) { throw new Error('No se ha encontrado la entidad asociada con ningún esquema declarado para este servicio.'); }
    const entityName: string = EntityName.resolve(query.model.backend).singular;
    const primaryKey: string = query.model.primaryKey;
    const deleted = data instanceof FormGroup ? data.value : data;
    return new Promise<any>((resolve: any, reject: any) => {
      // Quitamos la fila de la caché.
      const row = query.rows.find(r => r[primaryKey] === +deleted[primaryKey]);
      if (row) {
        query.rows.splice(query.rows.findIndex(findRowIndex(row)), 1);
        // Propagamos la elminación a las filas hijas.
        const entities = query.model.detail.propagateDeletes;
        this.propagateDeletes(entities, query, row, { host: options.host });
        if (this.debug) { console.log('AbstractModelService:' + this.constructor.name + '.removeRow() DELETE -> Fila eliminada ', { deleted }); }
      }
      resolve(true);
    });
  }

  protected propagateDeletes(entities: string | EntitySchema | (string | EntitySchema)[], parentQuery: EntityQuery, parentRow: any, options?: { host?: any }): void {
    // Transmitimos las eliminaciones de la fila a sus filas hijas.
    if (entities) {

      // Propagamos a las entidades hijas.
      const entitiesArray: (string | EntitySchema)[] = Array.isArray(entities) ? entities : [entities];
      // Ej: parentQuery = 'roles' => ['usuarios', 'perms']
      for (const entity of entitiesArray) {
        // Obtenemos la query hija actual.
        for (const query of this.findQueries(entity)) {
          // const list = query.model.list;
          if (query.model.list.foreign) {
            // Ej: foreign: { id_role: { role: 'nombre'}, ... }
            const foreigns = query.model.list.foreign;
            // Ej: foreignKey = 'id_role'
            Object.keys(foreigns).map(foreignKey => {
              // Ej: foreign = { role: 'nombre'}
              const foreign = foreigns[foreignKey];
              // Ej:foreignEntity =  'role'
              const foreignEntity = Object.keys(foreign)[0];
              if (EntityName.equals(parentQuery.name, foreignEntity)) {
                // Ej: 'nombre'
                const parentDisplay: any = Object.values(foreign)[0];
                // // Obtenemos el valor de la descripción para la clave foránea.
                EntityModel.resolveAsyncProperty(parentRow, parentDisplay, options.host).pipe(first()).subscribe((display: any) => {
                  const parentName = parentQuery.name;
                  const parentEntity = new ApiEntity(parentQuery.name.plural);
                  const entityName = EntityName.resolve(entity);
                  if (!query) { throw new Error(`No se ha encontrado la entidad '${entityName.plural}' suministrada para propagar las eliminaciones de '${parentName.singular}'.`); }
                  // Preparamos los nombres de las columnas afectadas.
                  const propDisplay = typeof parentDisplay === 'string' ? parentDisplay : parentName.singular;
                  const primaryKey = parentQuery.model.primaryKey;
                  console.log('propagateDeletes() -> ', { query, parentName, parentEntity, entityName, foreignKey, propDisplay, primaryKey });
                  // Si hay filas en la entidad hija...
                  if (query.rows && query.rows.length) {
                    // Obtenemos la info de las filas hijas.
                    let foreignDisplay = '';
                    const childRef = query.rows[0];
                    // Comprobamos si la información del padre aparece como un objeto o bien ha sido desagrupada (flat).
                    if (childRef.hasOwnProperty(parentName.singular) && typeof childRef[parentName.singular] === 'object') {
                      // Ej: festivo.tarifa = { descripcion: 'T-1' }
                      foreignDisplay = parentName.singular;

                    } else if (childRef.hasOwnProperty(parentName.plural) && typeof childRef[parentName.plural] === 'object') {
                      // Ej: festivo.tarifas = { descripcion: 'T-1' }
                      foreignDisplay = parentName.plural;

                    } else if (childRef.hasOwnProperty(parentEntity.table.aliasOrName) && typeof childRef[parentEntity.table.aliasOrName] === 'object') {
                      // Ej: precio_tarifa.origen = { nombre: 'Barcelona' }
                      foreignDisplay = parentEntity.table.aliasOrName;
                    }

                    // Iteramos las filas para eliminar las hijas.
                    for (let i = query.rows.length - 1; i > 0; i--) {
                      const child = query.rows[i];

                      console.log(`propagateDeletes() -> child -> `, child);
                      // Tiene la clave foránea.
                      if (child.hasOwnProperty(foreignKey)) {
                        // Comprobamos que se trata de su hija.
                        if (child[foreignKey] === parentRow[primaryKey]) {
                          query.rows.splice(i, 1);
                        }

                      } else if (foreignDisplay) {
                        // Comprobamos que tenga una clave primaria para comparar
                        if (!child[foreignDisplay].hasOwnProperty(primaryKey)) { throw new Error(`No se ha encontrado la clave primaria '${primaryKey}' en la fila padre incrustada '${foreignDisplay}' para poder propagar las eliminaciones en las filas hijas de '${query.name.plural}'.`); }
                        // Comprobamos que se trate de su hijo
                        if (child[foreignDisplay][primaryKey] === parentRow[primaryKey]) {
                          query.rows.splice(i, 1);
                        }

                      } else {
                        // No podemos propagar las eli8minaciones a esta entidad hija.
                        throw new Error(`Error propagando eliminaciones desde la fila padre '${parentName.singular}': las filas hijas de la entidad '${query.name.plural}' no tienen la columna '${foreignKey}' con la clave foránea.`);
                        // console.log(`propagateDeletes() -> no child -> `, { 'child[foreignKey]': child[foreignKey], 'parentRow[primaryKey]': parentRow[primaryKey], child, parentRow, foreignKey, primaryKey });
                      }
                      return child;
                    }
                  }
                });
              }
            });
          }
        }
      }
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Controllers
  // ---------------------------------------------------------------------------------------------------

  presentLoader(message?: string): Promise<HTMLIonLoadingElement> {
    return new Promise<HTMLIonLoadingElement>((resolve, reject) => {
      this.loadCtrl.create({
        message: this.translate.instant(message || 'api.updating') + '...',
        spinner: 'circles',
      }).then(loader => {
        loader.present();
        resolve(loader);
      }).catch(error => reject(error));
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Resolvers
  // ---------------------------------------------------------------------------------------------------

  /**
   * Returns the definition of the component so that the injector can instantiate it.
   * @param component: the selector of the component.
   * @category Resolvers
   */
  protected resolveFactory(component: any, options?: { componentName?: string }): Promise<any> { return resolveComponentFactory(component, options); }


  /**
   * Devuelve una cadena de texto con la traducción resultante.
   *
   * Cuando se pasan múltiples claves de traducción al servicio `TranslateService` éste devuelve un objeto con el nombre de la clave y
   * el texto resultante interpolado. Con una llamada a esta función se obtiene un texto resultado de concatenarlas todas.
   *
   * **Usage**
   * Ejemplo de una llamada simple donde únicamente se indica una clave de traducción.
   * ```typescript
   * const str = this.resolveTranslate('user.name_required');
   * // returns 'Se requiere un nombre para el usuario'
   * ```
   *
   * Ejemplo con una traducción parametrizada donde 'notify.nueva_reserva' tiene por valor 'Nueva reserva nº {{id}}':
   * ```typescript
   * const str = this.resolveTranslate({ key: 'notify.nueva_reserva', interpolateParams: { id: 123 });
   * // returns 'Nueva reserva nº 123'
   * ```
   *
   * Ejemplo con múltiples traducciones concadenadas:
   * ```typescript
   * const str = this.resolveTranslate({ key: ['notify.nueva_reserva', 'reserva.multiples_vehiculos'], interpolateParams: { id: 123 });
   * // returns 'Nueva reserva nº 123 con múltiples vehículos'
   * ```
   *
   * Llamada equivalente:
   * ```typescript
   * const str = this.resolveTranslate(this.translate({ key: ['notify.nueva_reserva', 'reserva.multiples_vehiculos'], interpolateParams: { id: 123 }));
   * // returns 'Nueva reserva nº 123 con múltiples vehículos'
   * ```
   * @param str: clave de la traducción u objeto válido para una llamada al servicio `TranslateService`.
   * @param concat: texto que se utilizará para unir múltiples cadenas de traducción.
   * @category Resolvers
   */
  protected resolveTranslate(str: string | object, concat?: string): string {
    if (typeof str === 'object' && str.hasOwnProperty('key') && str.hasOwnProperty('interpolateParams')) {
      str = this.translate.instant((str as any).key, (str as any).interpolateParams);
    }
    return resolveTranslate(str, concat);
  }

  /** Permite evaluar expresiones de código (como los presentes en `AbstractListSettings`) suministrando un contexto para el argumento `host` si hace falta. */
  evalOrExpr(value: stringOrExpr | booleanOrExpr | numberOrExpr, options?: EvalExpressionOptions): string | boolean | number {
    if (!value) { return (value as any); }
    if (!options) { options = {}; }
    if (options.host === undefined) { options.host = this; }
    return typeof value === 'object' && value.hasOwnProperty('expr') ? evalExpr(value.expr, options) : value;
  }
}

