import { OnInit, OnDestroy, Injector, ViewChild, Component, AfterViewInit, ElementRef, Renderer2, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { ModalController, NavController, AlertController, IonContent, MenuController, IonList, PopoverController, IonHeader } from '@ionic/angular';
import { BehaviorSubject, Subject, Subscription, timer } from 'rxjs';
import { catchError, first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { ApiEntity, ApiForeignFieldsType, ApiSearchClause, ApiSearchClauses, ConcatOperatorType, findRowIndex, OrderByTypeComplex, OrderByDirectionType, ApiFieldsType, UserSettingsService, combineClauses } from 'src/core/api';
import { patterns, matchWords, deepAssign, ConsoleService, ThemeService } from 'src/core/util';

import { FilterPipe } from '../pipes/filter.pipe';
import { GroupByPipe } from '../pipes/group-by.pipe';
import { EntityDetailSchema, EntitySchema, MultiSelectType, FilterTypeComplex, GroupByTypeComplex, EntityListSchema, FilterType, PickRowOptions } from '../model/entity-schema';
import { EntityName, EntityModel } from '../model/entity-model';
import { EntityQuery } from '../model/entity-query';
import { RowModelType } from '../model/entity-schema';
import { AbstractModelService } from '../abstract-model.service';
import { AbstractComponent } from './abstract.component';
import { AbstractListSettings, ListSettingsActionEvent } from './abstract-list-settings';


/** Definición de las opciones para refrescar la consulta. */
export interface AbstractListRequestOptions { host?: any; search?: ApiSearchClauses; event?: any; clearBefore?: boolean; }

/** Clase para manejar un componente de lista, como una página para acceder a las fichas o como un modal que permite su selección. */
@Component({
  selector: 'app-abstract-list-component',
  template: '',
})
export abstract class AbstractListComponent extends AbstractComponent implements OnInit, OnDestroy, AfterViewInit {
  /** @hidden */ protected debug = true && AppConfig.debugEnabled;

  /** @hidden */
  @ViewChild(IonHeader, { read: ElementRef, static: false }) header: ElementRef;
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild(IonList, { static: false }) ionList: IonList;

  // ---------------------------------------------------------------------------------------------------
  //  Properties
  // ---------------------------------------------------------------------------------------------------

  /** @hidden Referencia a la instancia de esta clase. Se utiliza para pasar el host como argumento en llamadas a funciones desde el template. */
  Me = this;

  /** Consulta asociada con el componente. */
  query: EntityQuery = undefined;

  /** Clave que identifica a la consulta de forma inequívoca en el servicio. Si no se establece se utiliza el nombre de la entidad por defecto. */
  queryKey: string;

  /**
   * Devuelve las filas de la caché del servicio asociado.
   *
   * **Usage**
   * Accedemos al array de filas a través de la propiedad `rows`.
   * ```html
   * <ion-item button *ngFor="let row of rows"></ion-item>
   * ```
   * @category Query
   */
  get rows(): any[] { return this.query.rows; }

  /**
   * Devuelve el número de página más reciente si se han paginado los resultados, o bien null si ya se han obtenido todos los resultados.
   * @category Query
   */
  get page(): number | null { return this.query.page; }

  /**
   * Indica cuando hay una operación de carga de datos en marcha.
   *
   * **Usage**
   * ```html
   * <ion-progress-bar *ngIf="loading"></ion-progress-bar>
   * ```
   */
  loading = false;
  /** Indica cuando se ha cargado el componente. */
  initialized = false;

  /**
   * Indica cuando hay una operación de precarga de datos en marcha.
   *
   * **Usage**
   * ```html
   * <ion-progress-bar *ngIf="preloading === row.idreg"></ion-progress-bar>
   * ```
   */
  preloading: false | 'new' | number = false;

  /**
   * Texto escrito por el usuario que se utiliza para filtrar las filas.
   *
   * **Usage**
   *
   * Capturamos el texto escrito por el usuario en el componente de búsqueda.
   * ```html
   * <ion-searchbar [(ngModel)]="match"></ion-searchbar>
   * ```
   * Usamos el texto de búsqueda para filtrar las filas a través del pipe en el componente de lista.
   * ```html
   * <ion-list *ngFor="let row of list.rows | filter:match:list.filter">
   * ```
   * @category Filter
   */
  match = undefined;
  /** @hidden Recordamos el último texto escrito por el usuario en el buscador. */
  protected lastMatch: string = undefined;

  /** Recuerda las cláusulas utilizadas durante la última búsqueda. */
  lastSearch: ApiSearchClauses = undefined;

  /**
   * Estado actual del filtro para la búsqueda avanzada. Se recuerda de la última llamada y se establece en la siguiente.
   *
   * Se puede definir el comportamiento del {@link FilterTypeComplex filtro} a través del modelo.
   * @category Filter
   */
  advancedSearch: any = undefined;

  /** Indica cuando, a pesar de añadir nuevos caracteres al texto de búsqueda y que el pipe a backend no sea requerido, si que debe filtrase el pipe localmente. */
  isLocalFilterStillRequired = undefined;

  /** @hidden Usada para filtrar propiedades en el template. */
  protected filterPipe = new FilterPipe();

  /** Filtro obtenido por inicialización del componente (via queryParams o bien via initilizePickRow) que se combina con el del esquema para formar el filtro base. */
  initialFilter: ApiSearchClauses = undefined;

  /** @hidden Permite que `FilterPipe` notifique las nuevas búsquedas del usuario al componente. */
  pipeFilterChanged = new Subject<string>();

  /** Current list order direction. */
  protected orderByDirection: OrderByDirectionType = undefined;
  /** Original list order. */
  protected originalOrderBy: ApiFieldsType;

  /** @hidden Colecciona los grupos colapsados. Los grupos se obtienen del uso del pipe GroupByPipe. */
  protected collapsed: any[] = [];

  /**
   * Indica si el componente se ejecuta en modo selección (desde un controlador modal) o como una página normal.
   *
   * **Usage**
   *
   * Mostrar/ocultar los botones del pie de página cuando se activa el modo modal de selección.
   * ```html
   * <ion-footer *ngIf="!isPickRowMode">
   * </ion-footer>
   * ```
   *
   * Ocultar el detalle del item que indica la navegación hacia la ficha de detalle.
   * ```html
   * <ion-item *ngFor="..." [detail]="!isPickRowMode">
   * ```
   * @Default `false`
   * @category Select
   */
  isPickRowMode = false;
  /**
   * Referencia al valor actualmente seleccionado por el usuario en modo modal.
   * @category Select
   */
  selected: any = undefined;
  /** Indica si se pueden crear nuevas filas. Se puede establecer a través de `initializePickRow`. */
  canCreate = true;
  /** Indica si el componente se ha abierto como un modal. */
  isModal = false;
  /** Indica si el componente se ha abierto como un popover. */
  isPopover = false;

  /**
   * Devuelve el modo de selección activo o bien `undefined` si no hemos activado ningún modo.
   *
   * Los modos de selección múltiple se declaran en el modelo a través de la propiedad {@link multiSelectModes}.
   *
   * Para cambiar el modo de selección o recibir notificaciones podemos suscribirnos a través del servicio al _Subject_ {@link multiSelectModeChanged}.
   *
   * **Usage**
   *
   * Usamos el modo activo para establecer las clases que aplican el efecto de selección lateral.
   * ```html
   * <ion-list [ngClass]="{ 'disable-pointer-events': multiSelect, 'list-left-editing': multiSelect }">
   * ```
   *
   * Declaración del icono utilizado para seleccionar los items.
   * ```html
   * <div [ngClass]="{'visible': multiSelect, 'active': multiSelect}">
   *   <ion-icon [name]="row.checked ? multiSelect?.checked : multiSelect?.unchecked"></ion-icon>
   * </div>
   * ```
   * @category MultiSelect
   */
  multiSelect: MultiSelectType = undefined;

  /**
   * Notifica el número de elementos seleccionados durante un proceso de selección múltiple.
   *
   * **Usage**
   *
   * Mostrar el total de ítems seleccionados.
   * ```html
   * <p>{{checkedChanged | async}} items seleccionados</p>
   * ```
   *
   * Deshabilitar el botón hasta que no haya almenos un item seleccionado.
   * ```html
   * <ion-button [disabled]="!(checkedChanged | async)">
   * ```
   * @category MultiSelect
   */
  checkedChanged: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  /** Configuración del componente de lista. @category ListSettings */
  settings: AbstractListSettings;

  // Dependencies
  /** @category Dependencies */ router: Router;
  /** @category Dependencies */ route: ActivatedRoute;
  /** @category Dependencies */ nav: NavController;
  /** @category Dependencies */ modal: ModalController;
  /** @category Dependencies */ popover: PopoverController;
  /** @category Dependencies */ alertCtrl: AlertController;
  /** @category Dependencies */ menu: MenuController;
  /** @category Dependencies */ console: ConsoleService;
  /** @category Dependencies */ theme: ThemeService;
  /** @category Dependencies */ render: Renderer2;
  /** @category Dependencies */ changeDetector: ChangeDetectorRef;
  /** @category Dependencies */ userSettings: UserSettingsService;

  //  Expose model for template
  // ---------------------------------------------------------------------------------------------------
  /** @category Model */ get entity(): EntityName { return this.model.name; }
  /** @category Model */ get primaryKey(): string { return this.model.primaryKey; }
  /** @category Model */ get detail(): EntityDetailSchema { return this.model.detail; }
  /** @category Model */ get list(): EntityListSchema { return this.model.list; }
  /** @category Model */ get headerText(): string { return this.model.list.headerText; }
  /** @category Model */ get addNewText(): string { return this.model.list.addNewText; }
  /** @category Model */ get loadingText(): string { return this.model.list.loadingText; }

  /** Indica si el scroll del contenido del componente está arriba del todo. */
  canScrollToTop = false;
  /** @hidden */
  scrolled = false;
  /** @hidden */
  scrollToTopFabButton: HTMLElement = undefined;
  /** @hidden */
  scrollToTopFabButtonClickListener: (this: HTMLElement, ev: MouseEvent) => any = undefined;

  /** Referencia al servicio abstracto. Esta propiedad se debe sobrescribir en el constructor de la clase heredada para una correcta inferencia de tipos. */
  service: AbstractModelService;

  constructor(
    /** @hidden */ public injector: Injector,
    /** @hidden */ public schema: EntitySchema,
  ) {
    super(injector, schema);
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.constructor()'); }

    // Inject required dependencies.
    this.route = this.injector.get<ActivatedRoute>(ActivatedRoute);
    this.router = this.injector.get<Router>(Router);
    this.nav = this.injector.get<NavController>(NavController);
    this.modal = this.injector.get<ModalController>(ModalController);
    this.popover = this.injector.get<PopoverController>(PopoverController);
    this.alertCtrl = this.injector.get<AlertController>(AlertController);
    this.menu = this.injector.get<MenuController>(MenuController);
    this.console = this.injector.get<ConsoleService>(ConsoleService);
    this.theme = this.injector.get<ThemeService>(ThemeService);
    this.render = this.injector.get<Renderer2>(Renderer2);
    this.changeDetector = this.injector.get<ChangeDetectorRef>(ChangeDetectorRef);
    this.userSettings = this.injector.get<UserSettingsService>(UserSettingsService);

    // Si se ha indicado un esquema en la ruta, prevalece al suministrado por el constructor de la clase heredada.
    if (this.route.snapshot.data.schema) {
      this.schema = this.route.snapshot.data.schema;
      this.model = new EntityModel(this.schema, this.translate);
    }
    // NOTA: Recogemos el filtro de los argumentos ahora, antes de que ocurra `initializePickRow` (que tb. ocurre antes de `ngOnInit`).
    if (this.route.snapshot.queryParams.filter) { this.initialFilter = JSON.parse(this.route.snapshot.queryParams.filter || 'null'); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Angular lifecycle : ngOnInit . ngOnDestroy
  // ---------------------------------------------------------------------------------------------------

  /** @category Lifecycle */
  ngOnInit(): void {
    super.ngOnInit();
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ngOnInit()'); }

    // Inyectamos las dependencias adicionales.
    if (this.model.list.dependencies) { this.injectDependencies(this.model.list.dependencies, this, this.service); }

    // Establecemos el host en el modelo para pasarlo como argumento a los callbacks asíncronos. Ex: FilterPipe.PreFilter()
    if (this.list.filter) {
      // Añadimos el host al filtro para que los pipes pueden pasar el host como argumento a sus funciones de transformación.
      (this.list.filter as FilterTypeComplex).host = this;
    }
    // Establecemos el host en el modelo para pasarlo como argumento a los callbacks asíncronos. Ex: FilterPipe.PreFilter()
    if (this.list.groupBy) {
      // Añadimos el host al filtro para que los pipes pueden pasar el host como argumento a sus funciones de transformación.
      (this.list.groupBy as GroupByTypeComplex).host = this;
    }

    // Estabelcemos el host y la función de callback para la ordenación de la lista.
    if (typeof this.list.orderBy === 'string') { this.list.orderBy = { pipe: this.list.orderBy }; }
    if (typeof this.list.orderBy === 'object' && Array.isArray(this.list.orderBy)) { this.list.orderBy = { pipe: this.list.orderBy }; }
    if (typeof this.list.orderBy === 'object') {
      const orderBy = this.list.orderBy as ApiForeignFieldsType | OrderByTypeComplex;
      // Si no se ha definido una función para el callback, usamos la función por defecto.
      if (typeof orderBy.callback !== 'function') { orderBy.callback = this.defaultOrderByCallback; }
      // Establecemos el host para la llamada al callback.
      orderBy.host = this;
      // Recordamos la ordenación original.
      this.originalOrderBy = orderBy.pipe;
    }

    // Creamos una consulta para este componente.
    this.query = this.service.registerQuery(this.model, this.queryKey);

    if (this.model.list.notifyCacheRow) {
      // Recibimos notificaciones desde otros componentes (incluso desde otros módulos) a través del servicio.
      this.subscriptions.push(...[
        // Recibimos notificaciones desde otros componentes (incluso desde otros módulos) a través del servicio.
        this.service.created.subscribe((data: RowModelType) => this.notifyCacheRow(data, 'insert')),
        this.service.modified.subscribe((data: RowModelType) => this.notifyCacheRow(data, 'update')),
        this.service.deleted.subscribe((data: RowModelType) => this.notifyCacheRow(data, 'delete')),
      ]);
    }

    this.subscriptions.push(...[
      // El componente recibe la orden de FilterPipe de realizar una llamada requerida a backend.
      this.pipeFilterChanged.subscribe((match: string) => this.pipeFilterToBackend(match)),
      // Recibimos notificaciones de la página contenedor a través del servicio.
      this.service.multiSelectModeChanged.subscribe((data: any) => this.updateMultiSelectMode(data)),
    ]);

    this.initializeListSettings();

    // Comprobamos la parametrización de la ruta.
    this.route.queryParams.pipe(first()).subscribe(params => {
      // Respetamos el valor si se ha establecido previamente desde initializePickRow.
      this.isPickRowMode = params.pickRowNotify === undefined ? this.isPickRowMode : params.pickRowNotify === 'true';
      // Comprobamos si se pueden crear filas nuevas.
      this.canCreate = params.canCreate === undefined ? this.canCreate : params.canCreate === 'true';
      // Obtenemos el valor seleccionado.
      this.selected = params.selected === undefined ? this.selected : +params.selected;
    });

    // Mientras la paginación no se haya completado, cargaremos la siguiente.
    if (!this.query.completed) { this.request(); }
  }

  ngAfterViewInit() {
    // Scroll to top.
    if (this.model?.list?.scrollToTop?.allow) { this.scrollingInitialize(); }
  }

  /** @category Lifecycle */
  ngOnDestroy(): void {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ngOnDestroy()'); }

    // Cancelamos la selección.
    if (this.isPickRowMode) { this.isPickRowMode = false; AbstractModelService.pickRowNotify.next(); }
    // Cancelamos el modo multiSelect.
    if (this.multiSelect) { this.closeMultiSelectMode(); }

    // Eliminamos las filas de la lista al salir.
    if (this.list.clearQueryOnDestroy) { this.query.clear(); }

    // Al terminar, restablecemos la ordenación original.
    if (this.list.orderBy) { (this.list.orderBy as OrderByTypeComplex).pipe = this.originalOrderBy; }

    // Cancelamos el listener para el 'click' sobre el 'ion-fab-button' para hacer scroll to top.
    if (this.scrollToTopFabButton) { this.scrollToTopFabButton.removeEventListener('click', this.scrollToTopFabButtonClickListener); }

    // Actualizamos el modelo y guardamos la configuración en el storage.
    this.saveListSettings();

    super.ngOnDestroy();
  }


  // ---------------------------------------------------------------------------------------------------
  //  request
  // ---------------------------------------------------------------------------------------------------


  /**
   * Llamada a la función request() del servicio asociado.
   * ```typescript
   * interface AbstractListRequestOptions { host?: any; search?: EntityListSchema['search']; event?: any; clearBefore?: boolean; }
   * ```
   * @param event: evento disparado por el componente `ion-infinite-scroll`.
   *
   * **Usage**
   * ```html
   * <ion-infinite-scroll (ionInfinite)="request({ event: $event })">
   * ```
   * <small>Es necesario pasar el evento como argumento para que el componente pueda diferenciar con las llamadas programáticas en las que borraría las filas primero.</small>
   * @category Query
   */
  request(options?: AbstractListRequestOptions): Promise<any[]> {
    if (!options) { options = {}; }
    if (options.host === undefined) { options.host = this; }
    if (options.search === undefined) { options.search = this.combineBaseClauses(null); }
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.request(event)  => ', options); }
    return new Promise<any[]>((resolve: any, reject: any) => {
      // Antes de refrescar establecemos siempre los settings en el modelo para que se utilicen durante la construcción de la consulta.
      this.updateListSchema();
      // Establecemos el indicador de estado.
      this.loading = true;
      // Recordamos las filas seleccionadas.
      const cache: any[] = this.cachingSelectedRows ? this.rows.filter(row => row.checked) : null;
      if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + ' -> cache => ', cache); }
      // Refrescamos las filas de la entidad actual a través del servicio.
      this.service.request(this.query, options).then(rows => {
        if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + ' -> this.service.request() => ', rows); }
        // Actualizamos las filas con la caché de filas seleccionadas.
        if (this.cachingSelectedRows) { this.refreshRowsWithCache(cache); }
        // Establecemos el indicador de estado.
        this.loading = false;
        // Nos situamos al principio de los resultados.
        if (!options.event && !!this.content) { this.content.scrollToTop(); }
        // Recordamos la última consulta.
        this.lastSearch = options.search;
        // Devolvemos las filas creadas.
        resolve(rows);

      }).catch((error: any) => reject(error)).finally(() => this.loading = false);
    });
  }


  //  nextPage . previousPage
  // ---------------------------------------------------------------------------------------------------

  nextPage(): Promise<any[]> {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.nextPage()'); }
    const clearBefore = true;
    const search = this.lastSearch;
    // Pasamos un objeto vacío para simular que viene provocado por un evento.
    return this.request({ search, event: {}, clearBefore });
  }

  previousPage(): Promise<any[]> {
    this.query.page -= 2;
    this.query.completed = false;
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.previousPage()'); }
    const clearBefore = true;
    const search = this.lastSearch;
    // Pasamos un objeto vacío para simular que viene provocado por un evento.
    return this.request({ search, event: {}, clearBefore });
  }


  //  find
  // ---------------------------------------------------------------------------------------------------

  /**
   * Inicia una operación de búsqueda.
   * @param combineBaseClauses: Indica si las cláusulas se combinarán con las del filtro original.
   * @param combineSearchbarClauses: Indica si las cláusulas se combinarán con las del cuadro de texto escritas por el usuario.
   */
  protected find(clauses: any, options?: { combineBaseClauses?: boolean, combineSearchbarClauses?: boolean }): Promise<any[]> {
    if (!options) { options = {}; }
    if (options.combineBaseClauses === undefined) { options = { combineBaseClauses: true }; }
    if (options.combineSearchbarClauses === undefined) { options = { combineSearchbarClauses: true }; }

    if (options.combineBaseClauses) { clauses = this.combineBaseClauses(clauses); }
    if (options.combineSearchbarClauses) { clauses = this.combineSearchbarClauses(clauses); }

    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.find()', this.list.search); }
    return this.request({ search: clauses });
  }


  //  pipe to backend
  // ---------------------------------------------------------------------------------------------------

  /** @hidden Ejecuta la consulta contra el _backend_. */
  protected pipeFilterToBackend(match: string, options?: { extra?: any }): void {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    // if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.pipeFilterToBackend() -> filter = ', filter); }
    // Comprobamos que se han definido campos para la propiedad pipe.
    if (!filter || !filter.pipe) { throw new Error(`No se ha definido ningún campo en la propiedad 'pipe' para el filtro de backend del modelo '${this.model.name.plural}'.`); }
    if (!options) { options = {}; }
    if (options.extra === undefined) { options.extra = null; }

    // Recordamos el último texto introducido.
    this.lastMatch = match;
    // Combinamos las cláusulas.
    const clauses = this.combineSearchbarClauses(options.extra);
    const search = this.combineBaseClauses(clauses);
    // Realizamos la llamada al backend a través de la función del componente.
    this.request({ search });
  }

  /** @hidden Evalua cuando es necesario interrumpir el filtrado local para aplicarlo contra el _backend_. Se llama desde la clase `PipeFilter` antes de aplicar el filtro. */
  pipeToBackendRequired(match: string): boolean | 'local' {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    if (!filter.pipeToBackend) { return false; }

    const last = this.lastMatch;

    if (this.loading) {
      this.isLocalFilterStillRequired = false;
      // console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired => this.loading ', { match, last });
      return false;
    }
    if (match && last === undefined) {
      this.isLocalFilterStillRequired = false;
      // console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired => last === undefined ', { match, last });
      return true;
    }
    if (match === last) {
      // console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired => match === last ', { match, last });
      return this.isLocalFilterStillRequired ? 'local' : false;
      return false;
    }

    // Delay entre
    const buffer = match.substring(last.length);
    const words = matchWords(buffer);
    const startWithSpace = !!buffer && !!buffer[0].match(patterns.punctuation);
    // No actualizamos el valor actual hasta que el buffer no contenga almenos una palabra, de esta manera ignoramos los espacios y signos de puntuación.
    if (words.length > 0) { this.lastMatch = match; }
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired(match)', { last, match, buffer, words }); }
    // Si el buffer contiene palabras nuevas (es decir, empieza por un espacio o signos de puntuación y a continuación hay almenos una letra)
    if (startWithSpace && words.length === 1 || words.length > 1) { this.isLocalFilterStillRequired = false; return true; }
    // Si hay un valor actual y es una continuación de la escritura... y además no estamos en una consulta paginada... evitamos ir al backend.
    if (last && match.startsWith(last) && this.query.completed) { this.isLocalFilterStillRequired = true; return 'local'; }
    // Se requiere una llamada al backend.
    this.isLocalFilterStillRequired = false;
    return true;
  }


  // ---------------------------------------------------------------------------------------------------
  //  filter
  // ---------------------------------------------------------------------------------------------------

  /**
   * Lanzamos un modal para presentar el componente de filtro para backend.
   *
   * **Usage**
   * ```html
   * <ion-icon (click)="showAdvancedSearch()" name="search"></ion-icon>
   * ```
   *
   * Podemos usar la función `hook` como alternativa a `onDismiss` (sobrescritura completa) si lo que queremos es
   * únicamente añadir unas acciones antes de la llamada a `request`.
   * ```typescript
   * showAdvancedSearch(): void {
   *   super.showAdvancedSearch({
   *     component: FacturasSearchComponent, beforeRequest: (host: FacturasListComponent): void => {
   *       host.usingCache = false;
   *       if (host.settings?.search) { host.settings.search.current = 'avanzada'; }
   *       host.searchInfo = 'usando búsqueda avanzada';
   *     }
   *   });
   * }
   * ```
   * @category Filter
   */
  showAdvancedSearch(options?: { component?: any, onDismiss?: (host: AbstractListComponent, detail: any) => void, beforeRequest?: (host: AbstractListComponent) => void }): void {
    // Obtenemos la configuración del modelo.
    const filter: any = this.model.list.filter;
    // Comprobamos las opciones.
    if (!options) { options = {}; }
    // La primera vez, inicializamos el componente con el valor del modelo.
    if (!this.advancedSearch && this.model.list?.filter?.hasOwnProperty('frm')) {
      const frm = (this.model.list.filter as FilterTypeComplex).frm;
      if (frm instanceof FormGroup) { this.advancedSearch = frm.value; }
    }

    // Referenciamos el callback.
    let onDismiss = options.onDismiss || filter.onDismiss;
    // Comprobamos si se ha suministrado una función para el callback del modal.
    if (!onDismiss) {
      // Si no se ha suministrado ninguna la declaramos ahora.
      onDismiss = (host: AbstractListComponent, detail: any): void => {
        // Recordamos el filtro actual para la próxima vez.
        host.advancedSearch = detail.data;
        // Parseamos el filtro.
        const clauses = host.parseAdvancedSearch(detail.data);
        // Combinamos las cláusulas.
        const search = this.combineBaseClauses(clauses);
        // Limpiamos la caché.
        host.query.clear();
        // Limpiamos la búsqueda del cuadro de texto.
        host.lastMatch = undefined; host.match = undefined;
        // Ejecutamos la función de hook.
        if (typeof options.beforeRequest === 'function') { options.beforeRequest(host); }
        // Realizamos la llamada al backend a través de la función del componente.
        host.request({ search });
      };
    }
    // Realizamos una carga dinámica del componente.
    this.resolveFactory(options.component || filter.component).then(component => {
      // Mostramos el modal.
      this.modal.create({
        component,
        componentProps: { filter: this.advancedSearch },
      }).then(modal => {
        modal.onDidDismiss().then((detail: any): void => onDismiss(this, detail));
        modal.present();

      }).catch(error => console.error(error));
    }).catch(error => console.error(error));
  }

  /**
   * Transforma el valor de la propiedad `filter` en cláusulas válidas para la API Rest.
   *
   * Filtro original obtenido del formulario:
   * ```typescript
   * { campo1: 'valor1', campo2: 'valor2', campo3: null }
   * ```
   *
   * Filtro transformado compatible con la API Rest:
   * ```typescript
   * { AND: [
   *   ['campo1', '=', 'valor1'],
   *   ['campo2', '=', 'valor2'],
   * ]}
   * ```
   *
   * Si se desea implementar un filtro con valores complejos como rangos de fechas que deban ser tratados
   * de forma específica o asignar operadores diferentes a las cláusulas, se deberá sobrescribir la función en
   * la clase heredada.
   * ```typescript
   * parseAdvancedSearch(filter?: any): ApiSearchClauses {
   *   const clauses: ApiSearchClause[] = [];
   *   // Construimos las cláusulas a partir del valor del formulario SearchComponent.
   *   if (filter.recogida) {
   *     clauses.push(['DATE(servicio.recogida)', '>=', moment(filter.recogidaDesde).format('YYYY-MM-DD')]);
   *     clauses.push(['DATE(servicio.recogida)', '<=', moment(filter.recogidaHasta).format('YYYY-MM-DD')]);
   *   }
   *   if (filter.estado) {
   *     const estados: ApiSearchClause[] = (filter.estados as any[]).filter(e => e.selected).map(e => ['servicio.estado', '=', e.value]);
   *     if (estados.length) { clauses.push({ OR: estados } as any); }
   *   }
   *   // Combinamos el filtro base con el construido a partir de la búsqueda del usuario.
   *   return clauses.length ? { AND: clauses } : null;
   * }
   * ```
   * @category Filter
   */
  parseAdvancedSearch(filter?: any): ApiSearchClauses {
    const concatOp = this.list.searchOR ? 'OR' : 'AND';
    const clauses: ApiSearchClause[] = [];

    // Construimos las cláusulas a partir del valor del formulario SearchComponent.
    if (filter) {
      for (const field of Object.keys(filter)) {
        const value = filter[field];
        // Ignoramos los valores nulos.
        if (value !== null) { clauses.push([field, '=', value]); }
      }
    }

    // Combinamos el filtro original con el construido a partir de la búsqueda del usuario.
    return this.combineBaseClauses(clauses.length ? (concatOp === 'OR' ? { OR: clauses } : { AND: clauses }) : null);
  }

  /**
   * Indica cuando se está aplicando un filtro local sobre los resultados obtenidos del backend.
   * Para ello debe haber un texto escrito en el cuadro de búsqueda y el filtro debe tener la propiedad `pipeToBackend` establecida en `false`.
   *
   * **Usage**
   *
   * Construimos el texto que se muestra al usuario informándole a cerca de los resultados.
   * ```html
   * <p>{{isLocalFiltered ? 'Filtrados' : 'Resultados:'}} <b>{{isLocalFiltered ? filtered.length : ''}}</b> {{isLocalFiltered ? 'de' : ''}} <b>{{rows.length}}</b></p>
   * ```
   * @category Filter
   */
  get isLocalFiltered(): boolean {
    return this.match && !(this.list.filter as FilterTypeComplex).pipeToBackend;
  }


  // ---------------------------------------------------------------------------------------------------
  //  api search clauses
  // ---------------------------------------------------------------------------------------------------

  /** Combina dos grupos de cláusulas con el operador indicado. */
  protected combineClauses(clausesA: ApiSearchClauses, clausesB: ApiSearchClauses, concatOp?: ConcatOperatorType): ApiSearchClauses { return combineClauses(clausesA, clausesB, concatOp); }

  /** @hidden Combina las cláusulas con la búsqueda base: filtro del modelo + filtro inicial (queryParams o initializePickRow). */
  protected combineBaseClauses(clauses: ApiSearchClauses): ApiSearchClauses {
    // Obtenemos las cláusulas de la consulta original.
    const search = this.model.list?.search;
    const base = search ? ((typeof search === 'function' ? search(this) : search) || null) as ApiSearchClauses : null;
    const concatOp = this.list.searchOR ? 'OR' : 'AND';
    // Obtenemos las cláusulas del filtro inicial (via pickRow o queryParams).
    const initial = this.combineClauses(base, this.initialFilter || null, concatOp);
    // Combinamos el filtro base con el construido a partir de la búsqueda del usuario.
    const final: ApiSearchClauses = this.combineClauses(clauses, initial, concatOp);
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.combineBaseClauses()', { base, final }); }
    return final;
  }

  /** @hidden Combina las cláusulas con la búsqueda escrita por el usuario en el cuadro de texto. */
  protected combineSearchbarClauses(clauses: ApiSearchClauses): ApiSearchClauses {
    // Obtenemos las cláusulas a partir del texto escrito por el usuario en el cuadro de búsqueda.
    const searchbar = this.buildSearchbarClauses(this.match);
    const concatOp = this.list.searchOR ? 'OR' : 'AND';
    // Combinamos el filtro base con el construido a partir de la búsqueda del usuario.
    const final: ApiSearchClauses = this.combineClauses(clauses, searchbar, concatOp);
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.combineSearchbarClauses()', { searchbar, final }); }
    return final;
  }

  /** @hidden Construye las cláusulas search a partir del texto de búsqueda indicado. */
  protected buildSearchbarClauses(match: string): any {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    // Comprobamos que se han definido campos para la propiedad pipe.
    if (!filter?.pipe) { throw new Error(`No se ha definido ningún campo en la propiedad 'pipe' para el filtro de backend del modelo '${this.model.name.plural}'.`); }
    // Nos aseguramos que se trata de un array.
    const fields = typeof filter.pipe === 'string' ? ApiEntity.splitFields(filter.pipe) : filter.pipe;
    // Obtenemos los campos agrupados por entidad.
    const entities: ApiEntity[] = ApiEntity.joinFields(ApiEntity.parseFields(this.model.backend.plural, fields.map(f => f.replace(/\?/g, ''))));
    // Obtenemos las cláusulas con la búsqueda del usuario.
    const clauses = [];
    const binary = filter.ignoreCase ? '' : 'BINARY ';

    if (match) {
      // Iteramos las entidades para crear las cláusulas.
      !filter.splitPipeWords
        ? entities.map(entity => entity.columns.map(c => clauses.push([`${entity.table.name}.${c.name}`, 'LIKE', `${binary}%${match}%`])))
        : filter.concatPipeWords === 'OR'
          ? entities.map(entity => entity.columns.map(c => matchWords(match).map(w => clauses.push([`${entity.table.name}.${c.name}`, 'LIKE', `${binary}%${w}%`]))))
          // : entities.map(entity => entity.columns.map(c => clauses.push({ AND: [...matchWords(match).map(w => [`${entity.table.name}.${c.name}`, 'LIKE', `${binary}%${w}%`])]})))
          : matchWords(match).map(w => clauses.push({ OR: [].concat.apply([], entities.map(entity => entity.columns.map(c => `${entity.table.name}.${c.name}`))).map(field => [field, 'LIKE', `${binary}%${w}%`]) }) )
      ;
    }
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.buildSearchbarClauses()', { splitPipeWords: filter.splitPipeWords, concatPipeWords: filter.concatPipeWords, clauses }); }
    return clauses.length ? { [!filter.splitPipeWords ? 'OR' : filter.concatPipeWords]: clauses } : null;
  }

  /**
   * Devuelve las palabras utilizadas para el filtro separadas por comas, resaltadas y saneadas para usar en la plantilla HTML.
   *
   * **Usage**
   *
   * ```html
   * <span *ngIf="match" [innerHTML]="searchWords()"></span>
   * ```
   * Para la búsqueda `Amsterdam Paris London` devuelve la siguiente expresión:
   * ```html
   * <span class="filtered">Amsterdam</span>, <span class="filtered">Paris</span> y <span class="filtered">London</span>
   * ```
   * @param replace Expresión html que se utiliza para envolver con tags las palabras buscadas y resaltarlas del resto del contenido. Si no se establece se utiliza por defecto `<span class="filtered">$1</span>`
   * @category Filter
   */
  searchWords(replace?: string): SafeHtml {
    if (!this.match) { return ''; }
    if (!replace) { replace = '<span class="filtered">$1</span>'; }
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    const concat = this.translate.instant(`search.${filter.concatPipeWords}`);
    // Remplazamos las palabras por tags coloreados.
    return !filter.splitPipeWords
      ? this.sanitizer.bypassSecurityTrustHtml(this.match.replace(/(.*)/, replace))
      : this.sanitizer.bypassSecurityTrustHtml(matchWords(this.match).map(w => w.replace(/(.*)/, replace)).join(',').replace(/,([^,]*)$/, ` ${concat} $1`).split(',').join(', '));
  }

  /**
   * Devuelve un contenido html con las ocurrencias del texto coloreadas.
   *
   * **Usage**
   * ```html
   * <text-colorized [value]="row.nombre" [match]="match"></text-colorized>
   * ```
   */
  colorMatch(text: string, match: string): SafeHtml {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    // const pipe = new FilterPipe();
    if (!!match && this.filterPipe.filterProperty(text, match, { splitWords: filter.splitPipeWords })) {
      const { ignoreCase, ignoreAccents, distinguishWords, maxDistinctions } = filter;
      return super.colorMatch(text, match, { splitWords: filter.splitPipeWords, ignoreCase, ignoreAccents, distinguishWords, maxDistinctions });
    } else {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }

  filterProperty(value: any): boolean {
    if (!this.match) { return false; }
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    const { ignoreAccents, ignoreCase, splitPipeWords } = filter;
    // const pipe = new FilterPipe();
    return this.filterPipe.filterProperty(value, this.match, { ignoreCase,  ignoreAccents, splitWords: splitPipeWords });
  }


  // ---------------------------------------------------------------------------------------------------
  //  saveRow . deleteRow . spliceRow
  // ---------------------------------------------------------------------------------------------------

  saveRow(data?: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.saveRow() -> resolveRowHook(saving) => '); }
      EntityModel.resolveRowHook(this.model.list.saving, data, this).pipe(first()).subscribe(row => {

        if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.saveRow(entity, row) => ', {entity: this.entity, row}); }
        this.service.saveRow(this.query, row, { host: this }).pipe(first()).subscribe(savedRow => {
          if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + ' -> resolve(savedRow)', savedRow); }
          // Establecemos los cambios en la fila.
          if (typeof savedRow === 'number') { row[this.primaryKey] = savedRow; } else { Object.assign(row, savedRow); }
          // Devolvemos la fila y navegamos, si procede.
          resolve(savedRow);

        }, (error: any) => reject(error));
      }, (error: any) => reject(error));
    });
  }

  /**
   * Elimina la fila del backend y de la caché de la consulta administrada.
   * @category Row Action
   */
  async deleteRow(row: any): Promise<any> {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.deleteRow(row) => ', { row, model: this.model }); }
    if (this.ionList) { await this.ionList.closeSlidingItems(); }
    return this.service.deleteRow(this.query, row, { host: this }).toPromise();
  }

  /**
   * Elimina la fila de la caché de la consulta administrada por el componente.
   * @param indexOrRow: indica la fila o el índice de la fila que hay que quitar.
   * @category Row Action
   */
  spliceRow(indexOrRow: number | object): void {
    // Quitamos la fila de la caché.
    if (typeof indexOrRow === 'number') {
      this.rows.splice(indexOrRow, 1);

    } else {
      this.rows.splice(this.rows.findIndex(findRowIndex(indexOrRow)), 1);
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  notificaciones externas
  // ---------------------------------------------------------------------------------------------------

  /** @hidden Atendemos las notificaciones externas a través del componente de listado para poder pasar al servicio una referencia como host. */
  protected notifyCacheRow(data: RowModelType, action: 'insert' | 'update' | 'delete'): void {
    // Comprobamos que la entidad notificada coincide con la del query registrado por este componente de lista.
    if (EntityName.equals(data.entity, this.query)) {
      this.service[`${action}CacheRow`](this.query, data.row, { host: this });
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  pick row
  // ---------------------------------------------------------------------------------------------------

  /**
   * Inicializa el modo modal para la selección de una fila de la lista.
   *
   * **Usage**
   * ```typescript
   * this.modal.create({
   *   component: PasajerosListComponent,
   *   componentProps: { initializePickRow: { selected: this.idPasajero } },
   * }).then(modal => {
   *   modal.onDidDismiss().then((detail: any): any => { ... }
   *   modal.present();
   * });
   * ```
   * @see {@link PickRowOptions}
   * @category Select
   */
  set initializePickRow(options: PickRowOptions) {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.initializePickRow(options) => ', options); }
    // Establecemos el indicador de estado.
    this.isPickRowMode = true;
    // Transferimos las opciones de inicialización al componente.
    const { selected, filter, canCreate, isModal, isPopover } = options;
    if (selected !== undefined) { this.selected = selected; }
    if (filter !== undefined) { this.initialFilter = filter; }
    if (canCreate !== undefined) { this.canCreate = !!canCreate; }
    if (isModal !== undefined) { this.isModal = !!isModal; }
    if (isPopover !== undefined) { this.isPopover = !!isPopover; }
    // Transferimos las propiedades adicionales.
    Object.keys(options.initialize).map(prop => this[prop] = options.initialize[prop]);
  }

  /**
   * En modo modal, indica si la fila coincide con la selección actual.
   *
   * **Usage**
   *
   * Por ejemplo, establecemos una clase css `selected` en función del valor devuelto por `isSelected()`:
   * ```html
   * <ion-item [ngClass]="{ 'selected': isSelected(row) }"><ion-item>
   * ```
   *
   * @category Select
   */
  isSelected(row: any): boolean {
    // Comprobamos si la fila es la seleccionada.
    const selected: any = row[this.model.primaryKey];
    // if (typeof selected === 'number') {
    if (!Number.isNaN(selected)) {
      if (this.selected === undefined || this.selected === '' || this.selected === null) { return false; }
      // console.log('isSelected is number => ', { '+this.selected': +selected, '+selected': +selected, current, 'typeof this.selected === \'string\' && !!this.selected': typeof this.selected === 'string' && !!this.selected ? true : false });
      return this.isPickRowMode && +this.selected === +selected;
    } else {
      // console.log('isSelected is not number => ', { ' this.selected ':  selected , ' selected':  selected, 'typeof this.selected === \'string\' && !!this.selected': typeof this.selected === 'string' && !!this.selected ? true : false });
      return this.isPickRowMode && this.selected === selected;
    }
  }

  /**
   * Acciona el clic sobre uno de los items de la lista.
   *
   * **Usage**
   *
   * Resuelve automáticamente en uno de los siguientes modos para:
   * - Navegar hacia la ficha del item seleccionado.
   * - Navegar hacia una nueva ficha.
   * - Marcar el item cuando estamos en modo modal.
   * ```html
   * <ion-list *ngFor="let row of rows">
   *   <ion-item button (click)="selectRow(row)"><ion-item>
   * </ion-list>
   * ```
   *
   * - Tambien para navegar hacia una nueva fila. Internamente se crea una fila como ```{ idreg: 'new' }```.
   * ```html
   * <ion-button (click)="selectRow()">
   * <ion-button (click)="selectRow('new')">
   * ```
   *
   * Podemos establecer una ruta alternativa a la propuesta por el modelo sobrescribiendo la función en la clase heredada.
   * ```typescript
   * selectRow(row: any) {
   *   const route = this.isPendientePago(row) ? [`/pagar-servicio/${row.idreg}`] : undefined;
   *   super.selectRow(row, route);
   * }
   * ```
   * <br />
   *
   * @category Select
   */
  selectRow(row?: any, options?: { route?: any, extras?: NavigationExtras, query?: EntityQuery, idreg?: number | 'new' }): void {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.selectRow(row) => ', row); }
    if (!options) { options = {}; }
    // Inicializamos la fila como nueva.
    if (!row || row === 'new') { row = { [this.model.primaryKey]: 'new' }; }
    // Obtenemos la clave primaria.
    options.idreg = options.idreg || row[this.model.primaryKey];
    // Comprobamos la acción que hay que realizar.
    if (this.isPickRowMode) {
      // Establecemos la fila seleccionada.
      this.selected = isNaN(+options.idreg) || options.idreg === null || options.idreg === 'new' ? options.idreg : +options.idreg;
      // Desactivamos el modo.
      this.isPickRowMode = false;
      // Cerramos el componente.
      this.closePickRow().then(() => {
        // Notificamos el valor seleccionado al componente que originó picRow.
        AbstractModelService.pickRowNotify.next({ model: this.model, row });
      });

    } else if (this.multiSelect) {
      // Uno de los modos de selección lateral está activo.
      if (!this.multiSelect.multi) { this.toggleCheckAll(false); }
      // Permutamos el estado de selección de la fila.
      row.checked = !row.checked;
      // Actualizamos el contador de filas seleccionadas.
      this.checkedChanged.next(this.match ? this.countChecked() : this.checkedChanged.getValue() + (row.checked ? 1 : -1));

    } else {
      // Cargamos y/o navegamos hacia el componente de detalle para la fila seleccionada.
      if (this.model.preload) {
        // Si no existe ya una operación de precarga en marcha...
        if (!this.preloading) {
          // Recordamos el identificador para saber de qué ficha hay que mostrar el loader en el template.
          this.preloading = options.idreg;
          // Obtenemos la fila seleccionada del backend.
          this.service.getRow(options.query || this.query, options.idreg, { host: this }).pipe(first()).subscribe((preloaded: any) => {
            if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.selectRow() -> preloaded => ', preloaded); }
            // Guardamos la fila en el service para que la cargue el componente de detalle más adelante.
            this.service.preloadedRow = preloaded;
            // Navegamos hacia la ficha.
            this.navigateToDetail(row, options.route, options.extras);
          });
        }

      } else {
        // Navegamos hacia la ficha.
        this.navigateToDetail(row, options.route, options.extras);
      }
    }
  }

  /** @hidden Fuerza el cierre del componente de lista. */
  protected closePickRow(): Promise<any> {
    return this.isModal
      ? this.modal.dismiss()
      : (this.isPopover
        ? this.popover.dismiss()
        : this.nav.pop()
      )
    ;
  }

  /** @hidden Navega hacia la ficha de detalle en la ruta indicada o deducida del modelo. */
  protected navigateToDetail(row: any, route?: any, extras?: NavigationExtras): void {
    // Obtenemos el identificador de la fila.
    EntityModel.resolveAsyncValue(this.model.detail.queryParams, row, this).pipe(catchError(error => this.alertError(error))).subscribe((queryParams: { [key: string]: any }) => {
      if (!extras) { extras = {}; }
      if (queryParams) { deepAssign(extras.queryParams, queryParams); }
      if (route) {
        if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.navigateToDetail() => ', route); }
        // Navegamos hacia la ruta indicada y tras finalizar restablecemos el indicador de precarga.
        this.router.navigate(route, extras).finally(() => this.preloading = false);

      } else {
        // Resolvemos la info de la ruta.
        this.model.resolveRoute(this.model.detail.route, row, this).pipe(first()).subscribe((value: any) => {
          if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.navigateToDetail() -> resolveRoute() => ', value); }
          // Navegamos hacia la ruta obtenida y tras finalizar restablecemos el indicador de precarga.
          this.router.navigate(value, extras).finally(() => this.preloading = false);
        });
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  order rows (by column)
  // ---------------------------------------------------------------------------------------------------

  /** Devuelve el icono que indica la dirección de ordenación: `caret-down` o `caret-up`
   * ```html
   * <ion-item (click)="orderRows('cliente')">
   *   <ion-label>Cliente</ion-label>
   *   <ion-icon *ngIf="isOrderedBy('cliente')" [name]="orderByIcon"></ion-icon>
   * </ion-item>
   * ```
   */
  get orderByIcon(): string {
    return this.orderByDirection === 'asc' || this.orderByDirection === 1 ? 'caret-down'
      : (this.orderByDirection === 'desc' || this.orderByDirection === -1 ? 'caret-up' : '')
    ;
  }

  /** Establece el nuevo orden en el esquema con la columna indicada. Si se ejecuta consecutivamente argumentando la misma columna
   * la dirección se permuta entre `'asc'`, `'desc'` y `undefined` (restaura la ordenación original).
   * ```html
   * <ion-item (click)="orderRows('cliente')">
   *   <ion-label>Cliente</ion-label>
   *   <ion-icon *ngIf="isOrderedBy('cliente')" [name]="orderByIcon"></ion-icon>
   * </ion-item>
   * ```
   */
  orderRows(column: string) {
    const orderBy = this.list.orderBy as OrderByTypeComplex;
    // Si repite columna...
    if (this.isOrderedBy(column)) {
      // Si está en descendente...
      if (this.orderByDirection === 'desc' || this.orderByDirection === -1) {
        // Restauramos el orden original.
        orderBy.pipe = this.originalOrderBy;
        this.orderByDirection = undefined;
      } else {
        // Invertimos el orden.
        orderBy.pipe = `-${column}`;
        this.orderByDirection = 'desc';
      }
    } else {
      // Establecemos la nueva columna.
      orderBy.pipe = column;
      this.orderByDirection = 'asc';
    }
  }

  /** Indica si la ordenación actual se basa en la columna indicada.
   * ```html
   * <ion-item (click)="orderRows('cliente')">
   *   <ion-label>Cliente</ion-label>
   *   <ion-icon *ngIf="isOrderedBy('cliente')" [name]="orderByIcon"></ion-icon>
   * </ion-item>
   * ```
   */
  isOrderedBy(column: string): boolean {
    const orderBy = this.list?.orderBy as OrderByTypeComplex;
    if (!orderBy) { return false; }
    return orderBy.pipe === column || orderBy.pipe === `-${column}`;
  }


  // ---------------------------------------------------------------------------------------------------
  //  groups
  // ---------------------------------------------------------------------------------------------------

  /** Establece el estado de agrupación de las filas de la consulta. */
  groupBy(data: any) {
    if (data === 'collapse') {
      this.collapseAllGroups();
    } else {
      this.collapsed = [];
    }
    this.changeDetector.markForCheck();
  }

  /**
   * Devuelve la clave del grupo que angular necesita para identificar a los elementos de una colección que
   * se itera mediante una directiva *ngFor.
   *
   * Proveer de un índice permite que angular pueda identificar cada elemento y evitar tener que  redibujarlo
   * de nuevo en el DOM, lo que redunda en una mejora muy notable del rendiemiento con grandes colecciones.
   *
   * **Usage**
   *
   * ```html
   * <ion-row *ngFor="let group of filtered; trackBy: groupId">
   * ```
   * @category Group
   */
  groupId(index: string, group: any): string {
    if (!group) { return null; }
    return group.key;
  }

  /**
   * Devuelve el identificador de la fila que angular necesita para identificar los elementos de una colección que
   * se itera mediante una directiva *ngFor.
   *
   * Proveer de un índice permite que angular pueda identificar cada elemento y evitar tener que  redibujarlo
   * de nuevo en el DOM, lo que redunda en una mejora muy notable del rendiemiento con grandes colecciones.
   *
   * **Usage**
   *
   * ```html
   * <ion-col size="12" *ngFor="let row of group.rows; trackBy: rowId">
   * ```
   * @category Group
   */
  rowId(index: number, row: any): number {
    if (!row) { return null; }
    return row.idreg;
  }

  /**
   * Indica si el grupo está collapsado.
   *
   * **Usage**
   *
   * Por ejemplo para saber qué icono hay que mostrar en el divider que representa el grupo.
   * ```html
   * <ion-icon [name]="isCollapsed(group) ? 'chevron-down' : 'chevron-up'"></ion-icon>
   * ```
   * @param group Referencia a uno de los grupos devueltos por `GroupByPipe`.
   * @category Group
   */
  isCollapsed(group: any): boolean {
    const status = this.collapsed.find(g => g.key === group.key);
    return status ? status.value : false;
  }

  /**
   * Permuta el estado del grupo entre collapsed y expanded.
   *
   * **Usage**
   *
   * ```html
   * <ng-container *ngFor="let group of settings.group.values">
   *   <ion-item (click)="toggleGroupBy(group)">...</ion-item>
   * </ng-container>
   * ```
   * @param group Referencia a uno de los grupos devueltos por `GroupByPipe`.
   * @category Group
   */
  toggleCollapsed(group: any): void {
    const status = this.collapsed.find(g => g.key === group.key);
    if (status) {
      status.value = !status.value;
    } else {
      this.collapsed.push({ key: group.key, value: true });
    }
  }

  /**
   * Colapsa todos los grupos devueltos por el pipe `GroupByPipe`.
   *
   * **Usage**
   *
   * ```html
   * <ion-button (click)="collapseAllGroups()">
   * ```
   * @category Group
   */
  collapseAllGroups(): void {
    const collapsed: any[] = [];
    const groupBy = new GroupByPipe();
    const groups = groupBy.transform(this.rows, this.list.groupBy as GroupByTypeComplex);
    if (groups && groups.length) {
      (groups as any[]).map(g => collapsed.push({ key: g.key, value: true }));
    }
    this.collapsed = collapsed;
  }

  /**
   * Expande todos los grupos devueltos por el pipe `GroupByPipe`.
   *
   * **Usage**
   *
   * ```html
   * <ion-button (click)="expandAllGroups()">
   * ```
   * @category Group
   */
  expandAllGroups(): void {
    this.collapsed = [];
  }



  // ---------------------------------------------------------------------------------------------------
  //  multiSelectMode
  // ---------------------------------------------------------------------------------------------------

  /**
   * Devuelve los modos disponibles para realizar un proceso de selección de los items de la lista.
   *
   * @see {@link MultiSelectType}
   * @category MultiSelect
   */
  get multiSelectModes(): MultiSelectType[] {
    return this.model.list.multiSelectModes || [];
  }

  /** @hidden Responde a las notificaciónes de otros componentes cuando se modifica el modo de selección múltiple actual. */
  protected updateMultiSelectMode(data: any): void {
    // Cuando se activa un modo, restauramos todos los items de la lista.
    if (data.value) { this.toggleCheckAll(false); }
    // Tras cerrar el menú, establecemos el modo actual.
    this.menu.close().then(() => {
      this.multiSelect = data.value ? this.multiSelectModes.find(m => m.name === data.name) : undefined;
      if (!data.value) { this.rows.map(row => delete row.checked); }
    });
  }

  /**
   * Termina el modo actual de selección múltiple.
   *
   * **Usage**
   * ```html
   * <ion-button (click)="closeMultiSelectMode()">Cancel</ion-button>
   * ```
   * @category MultiSelect
   */
  closeMultiSelectMode(): void {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.closeMultiSelectMode() => ', this.multiSelect.name); }
    this.service.multiSelectModeChanged.next({ name: this.multiSelect.name, value: false });
  }

  /**
   * Permuta el estado de selección de todas las filas seleccionables.
   *
   * **Usage**
   * ```html
   * <ion-button (click)="toggleCheckAll(true)">Marcar todos</ion-button>
   * ```
   * @param value Estado de selección que se establecerá en las filas afectadas.
   * @category MultiSelect
   */
  toggleCheckAll(value: boolean): void {
    // Filtramos las filas que son susceptibles de ser seleccionadas (chequeables).
    const checkeable = this.rows.filter(row => this.isCheckable(row));
    // Actualizamos el estado de selección de las filas chequeables.
    checkeable.map(row => row.checked = value);
    // Actualizamos el contador de filas seleccionadas.
    this.checkedChanged.next(value ? checkeable.length : 0);
  }

  /**
   * Permuta el estado de selección de todas las filas seleccionables filtradas.
   *
   * **Usage**
   * ```html
   * <ion-button (click)="toggleCheckFiltered(true)">Marcar filtrados</ion-button>
   * ```
   * @param value Estado de selección que se establecerá en las filas afectadas.
   * @category MultiSelect
   */
  toggleCheckFiltered(value: boolean): void {
    const pipe = new FilterPipe();
    // Filtramos las filas que son susceptibles de ser seleccionadas (chequeables).
    const checkeable = this.rows.filter(row => this.isCheckable(row));
    // Obtenemos las filas que superan el filtro.
    const filtered = checkeable.filter(row => pipe.applyFilter(row, this.lastMatch, this.model.list.filter, { ignoreChecked: false }));
    // Actualizamos el estado de selección de las filas filtradas.
    filtered.map(row => row.checked = value);
    // Actualizamos el contador de filas seleccionadas.
    this.checkedChanged.next(checkeable.filter(row => row.checked).length);
  }

  /** @hidden
   * Indica si la fila actual es seleccionable en función del modo de selección múltiple activado.
   * Si no lo es se ocultará hasta que se desactive el modo de selección actual.
   */
  protected isCheckable(row: any): boolean {
    return typeof this.multiSelect?.checkable === 'function' ? this.multiSelect.checkable(row, this) : true;
  }

  /** @hidden Devuelve el número de filas actualmente seleccionadas. */
  protected countChecked(): number {
    return this.rows?.length ? this.rows.filter(row => this.isCheckable(row) && !!row.checked).length : 0;
  }

  /** @hidden
   * Indica si hay que mantener una caché de las filas seleccionadas durante el modo de selección múltiple
   * para evitar perderlas cada vez que el usuario realiza una nueva consulta al _backend_.
   */
  protected get cachingSelectedRows(): boolean {
    return this.model.list.filter ? !!this.multiSelect && (this.model.list.filter as FilterTypeComplex).pipeToBackend : false;
  }

  /** @hidden Refresca la colección de filas con las filas de la caché. */
  protected refreshRowsWithCache(cache: any[]): void {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.refreshRowsWithCache()', cache); }
    // Iteramos las filas de la caché.
    cache.forEach(row => {
      // Buscamos la fila en la lista actual.
      const idx = this.findIndex(row, this.rows);
      if (idx > -1) {
        // Si ya existe, la marcamos como seleccionada.
        this.rows[idx].checked = true;
        if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.refreshRowsWithCache() -> mark row as checked', this.rows[idx]); }

      } else {
        // Si no existe, la añadimos ahora.
        this.rows.push(row);
        if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.refreshRowsWithCache() -> add row to collection', row); }
      }
    });
  }

  /** @hidden Devuelve el índice de la fila en la colección suministrada, o -1 si no la encuentra. */
  protected findIndex(row: any, rows: any[]): number {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][this.model.primaryKey] === row[this.model.primaryKey]) { return i; }
    }
    return -1;
  }


  // ---------------------------------------------------------------------------------------------------
  //  scroll to selected item
  // ---------------------------------------------------------------------------------------------------

  scrollToSelectedItem(count?: number) {
    timer(500).pipe(first()).subscribe(observer => {
      if (this.isPickRowMode && this.selected) {
        let list = document.querySelector('div.modal-wrapper ion-list');
        if (!list) { list = document.querySelector(`${this.selector} ion-list`); }
        const elements: HTMLCollectionOf<Element> = list ? list.getElementsByClassName('selected') : undefined;
        if (elements && elements.length > 0) {
          const selected = elements[0];
          selected.scrollIntoView();

        } else {
          // Comprobamos el número de intentos.
          if (count < 5) {
            // Incrementamos el contador.
            count += 1;
            // Lo intentamos de nuevo.
            return this.scrollToSelectedItem(count);
          }
        }
      }
    });

  }

  /** @hidden Después de terminar de ordenar los items de la lista, seleccionamos el elemento en modo pickRow. */
  defaultOrderByCallback(host?: any): void {
    if (!!host && host.isPickRowMode && host.selected && !host.scrolled) {
      // console.log('callback order !!!!!');
      host.scrolled = true;
      host.scrollToSelectedItem();
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  scroll to top: fab-button
  // ---------------------------------------------------------------------------------------------------

  /**
   * Resolvemos programáticamente todo lo que se implementa en el siguiente template:
   * ```html
   * <ion-header [ngClass]="{ shadow: canScrollToTop }">
   *   ...
   * </ion-header>
   * <ion-content [scrollEvents]="true" (ionScroll)="scrolling($event)">
   *   ...
   *   <ion-fab  vertical="bottom" horizontal="center" slot="fixed" style="left: 50%;">
   *     <ion-fab-button *ngIf="canScrollToTop" (click)="this.content.scrollToPoint(null, 0, 500)" color="dark">
   *       <ion-icon name="arrow-up" style="font-size: 20px;"></ion-icon>
   *     </ion-fab-button>
   *   </ion-fab>
   * </ion-content>
   * ```
   */
  protected scrollingInitialize() {
    if (this.content) {
      // Activamos la escuha de eventos de scroll (viene desactivado por defecto por motivos de rendimiento).
      this.content.scrollEvents = true;
      // Monitorizamos el scroll del `IonContent`.
      this.subscriptions.push(this.content.ionScroll.subscribe((ev: CustomEvent<any>) => this.scrolling(ev)));
      // Referenciamos el elemento HTML subyacente.
      const content = (this.content as any).el as HTMLElement;
      // Insertamos al final del contenido el `ion-fab-button` para hacer scroll to top.
      const allowFabButton = !!this.model.list?.scrollToTop?.allowFabButton;
      if (allowFabButton && !this.scrollToTopFabButton) {
        this.scrollToTopFabButtonClickListener = (ev: MouseEvent): any => this.content.scrollToPoint(null, 0, 500);
        const button = this.render.createElement('ion-fab-button');
        this.render.setAttribute(button, 'color', 'dark');
        button.addEventListener('click', this.scrollToTopFabButtonClickListener);
        button.innerHTML = `<ion-icon name="arrow-up" style="font-size: 20px;"></ion-icon>`;
        this.scrollToTopFabButton = button;
        const fab = this.render.createElement('ion-fab');
        this.render.setAttribute(fab, 'vertical', 'bottom');
        this.render.setAttribute(fab, 'horizontal', 'center');
        this.render.setAttribute(fab, 'slot', 'fixed');
        this.render.setStyle(fab, 'left', '50%');
        this.render.setStyle(fab, 'opacity', '0.9');
        this.render.appendChild(fab, button);
        this.render.appendChild(content, fab);
        // this.scrollToTopFabButtonClickListener = (ev: MouseEvent): any => this.content.scrollToPoint(null, 0, 500);
        // const button = document.createElement('ion-fab-button');
        // button.setAttribute('color', 'dark');
        // button.addEventListener('click', this.scrollToTopFabButtonClickListener);
        // button.innerHTML = `<ion-icon name="arrow-up" style="font-size: 20px;"></ion-icon>`;
        // this.scrollToTopFabButton = button;
        // const fab = document.createElement('ion-fab');
        // fab.setAttribute('vertical', 'bottom');
        // fab.setAttribute('horizontal', 'center');
        // fab.setAttribute('slot', 'fixed');
        // fab.style.setProperty('left', '50%');
        // fab.style.setProperty('opacity', '0.9');
        // fab.appendChild(button);
        // content.appendChild(fab);
        // Añadimos un padding al final de la lista para que el fab-button no oculte las últimas filas.
        const list = content.parentElement.querySelector('ion-content > ion-list:last-of-type') as HTMLElement;
        if (list) { list.style.paddingBottom = '100px'; }
      }
      // Actualizamos la interfaz según el la posición actual del scroll.
      this.toogleShadowCssClassToHeader();
    }
  }

  /** Responde al scroll del `IonContent`. */
  protected scrolling(ev: CustomEvent<any>) {
    // if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.scrolling()', ev); }
    // Recordamos el estado anterior.
    const oldValue = this.canScrollToTop;
    // Establecemos el nuevo estado en función de la posición del scroll.
    this.canScrollToTop = ev?.detail?.scrollTop > 0 || false;
    // Si el estado ha cambiado, permutamos la clase css en el header.
    if (oldValue !== this.canScrollToTop) { this.toogleShadowCssClassToHeader(); }
  }

  /** Comprueba si hay que añadir o quitar la clase `shadow` del `ion-header` en función de la posición del scroll. */
  protected toogleShadowCssClassToHeader(ev?: CustomEvent<any>) {
    // if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.toogleShadowCssClassToHeader()', ev); }
    const header = this.header?.nativeElement;
    if (header) {
      const cssClass = this.model?.list?.scrollToTop?.headerCssClass || 'shadow';
      const contains = header.classList.contains(cssClass);
      if (this.canScrollToTop) {
        if (!contains) { header.classList.add(cssClass); }
      } else {
        if (contains) { header.classList.remove(cssClass); }
      }
    }
    const fab = this.scrollToTopFabButton;
    if (fab) { fab.style.setProperty('display', this.canScrollToTop ? 'block' : 'none'); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  print
  // ---------------------------------------------------------------------------------------------------

  print(item: any): void {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.print()', item); }

  }


  // ---------------------------------------------------------------------------------------------------
  //  list settings
  // ---------------------------------------------------------------------------------------------------

  /** Sobrescribir en la clase heredada para cmabiar la clave del storage. @category ListSettings */
  get settingsStorageKey(): string { return `${this.model.name.plural}ListSettings`; }

  /** Inicializa la configuración del componente, */
  initializeListSettings(): void {
    const key = this.settingsStorageKey;

    // A través de `get` dispondremos de una versión continuamente actualizada.
    this.userSettings.get(key).then(behavior => this.subscriptions.push(behavior.subscribe(settings => {
      if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.initializeListSettings() -> userSettings.get() => ', settings); }
      // storage -> settings
      this.settings = settings || this.service.defaultListSettings(key);
      // settings -> schema
      this.updateListSchema();
    })));
    // menu -> action
    this.subscriptions.push(this.service.listSettingsAction.subscribe(event => this.listSettingsAction(event)));
  }

  /** Actualizamos el modelo y guardamos la configuración en el storage. @category ListSettings */
  saveListSettings(): void {
    if (this.settings) {
      if (this.settings.search) { this.settings.search.current = 'cache'; }
      // settings -> schema
      this.updateListSchema();
      // settings -> storage
      this.userSettings.set(this.settingsStorageKey, this.settings);
    }
  }

  /** Restaura la configuración a su valor por defecto. */
  restartSettings(): void {
    const key = this.settingsStorageKey;
    this.settings = this.service.defaultListSettings(key);
  }

  /** Actualiza el modelo con la configuración del componente de listado. @category ListSettings */
  updateListSchema(): void {
    if (this.settings) {
      const list = this.model.list;
      // Establecemos las settings actuales en el modelo.
      if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.updateListSchema() -> settings => ', this.settings); }
      if (this.settings.search?.filter) {
        const { pipe, itemsPerPage, ...filter } = this.settings.search?.filter;
        const fields = pipe.filter(f => f.value).map(f => f.fields).join(',');
        if (list.filter) {
          const complex = list.filter as FilterTypeComplex;
          deepAssign(complex, filter);
          complex.pipe = fields;
        }
        list.itemsPerPage = itemsPerPage;
      }
      if (this.settings.group) {
        const group = this.settings.group.current ? this.settings.group.values.find(g => g.name === this.settings.group.current) : undefined;
        if (list.groupBy) {
          const complex = list.groupBy as GroupByTypeComplex;
          complex.property = group ? group.fields : undefined;
        }
      }
      if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.updateListSchema() -> this.list => ', list); }
    }
  }

  /** Atendemos las acciones ordenadas desde el menu. */
  listSettingsAction(event: { action: ListSettingsActionEvent, data?: any }): void {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.listSettingsAction(event) => ', event); }
    switch (event.action) {
      case 'find': this.find(event.data); break;
      case 'advancedSearch': this.showAdvancedSearch(); break;
      case 'groupBy': this.groupBy(event.data); break;
      case 'restartSettings': this.restartSettings(); break;
      case 'print': this.print(event.data); break;
      default: if (this.debug) { console.warn(this.constructor.name + `.listSettingsAction() -> not implemented action '${event.action}'.`, event); }
    }
  }

  /** Template short for current view list settings. */
  get viewSettings(): any { return this.settings?.view.values.find(v => v.name === this.settings.view.current); }
  /** Template short for current group list settings. */
  get groupSettings(): any { return this.settings?.group.values.find(v => v.name === this.settings.group.current); }
  /** Template short for current search list settings. */
  get searchSettings(): any { return this.settings?.search.values.find(v => v.name === this.settings.search.current); }

  /** Transmite la configuración actual del componente de lista a los text-colorized del template.
   * ```html
   * <text-colorized [options]="textColorizedOptions">
   * ```
   * @category ListSettings
   */
  get textColorizedOptions(): { ignoreCase?: boolean, splitWords?: boolean; } {
    const filter = this.settings?.search?.filter;
    if (!filter) { return {}; }
    return {
      ignoreCase: filter?.ignoreCase,
      splitWords: filter?.splitPipeWords,
    };
  }



  // ---------------------------------------------------------------------------------------------------
  //  Ionic lifecycle
  // ---------------------------------------------------------------------------------------------------

  /** @category Lifecycle */
  ionViewWillLeave(): void {
    super.ionViewWillLeave();
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ionViewWillLeave()'); }
  }

  /** @category Lifecycle */
  ionViewDidLeave(): void {
    super.ionViewDidLeave();
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ionViewDidLeave()'); }
  }

  /** @category Lifecycle */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    this.theme.checkStatusBar(this);

    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ionViewWillEnter()'); }
  }

  /** @category Lifecycle */
  ionViewDidEnter(): void {
    super.ionViewDidEnter();
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ionViewDidEnter()'); }

    // Establecemos el indicador de estado.
    this.initialized = true;
  }

}
