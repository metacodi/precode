import { OnInit, OnDestroy, Injector, ViewChild, Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { ModalController, NavController, AlertController, IonContent, MenuController, IonItemSliding, IonList, PopoverController } from '@ionic/angular';
import { BehaviorSubject, Observable, of, Subject, Subscription, timer } from 'rxjs';
import { catchError, first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { ApiEntity, ApiForeignFieldsType, ApiSearchAndClauses, ApiSearchClause, ApiSearchClauses, ConcatOperatorType, findRowIndex, OrderByTypeComplex } from 'src/core/api';
import { patterns, matchWords, deepAssign, ConsoleService, ThemeService } from 'src/core/util';

import { FilterPipe } from '../pipes/filter.pipe';
import { GroupByPipe } from '../pipes/group-by.pipe';
import { EntityDetailSchema, EntitySchema, MultiSelectType, FilterTypeComplex, GroupByTypeComplex, EntityListSchema, FilterType } from '../model/entity-schema';
import { EntityName, EntityModel } from '../model/entity-model';
import { EntityQuery } from '../model/entity-query';
import { RowModelType } from '../model/entity-schema';
import { AbstractModelService } from '../abstract-model.service';
import { AbstractComponent } from './abstract.component';


/**
 * Clase para manejar un componente de lista, como una página para acceder a las fichas o como un modal que permite su selección.
 *
 * **Usage**
 * ```typescript
 * import { AbstractListComponent, EntitySchema } from 'src/core';
 *
 * import { ClientesSchema } from 'src/app/model';
 * import { ClientesService } from './clientes.service';
 *
 * @Component({
 *   selector: 'app-clientes-list',
 *   templateUrl: 'clientes-list.component.html',
 *   styleUrls: ['clientes-list.component.scss'],
 * })
 * export class ClientesListComponent extends AbstractListComponent {
 *   constructor(
 *     public injector: Injector,
 *   ) {
 *     super(injector, ClientesSchema, ClientesService);
 *   }
 * }
 * ```
 */
@Component({
  selector: 'app-abstract-list-component',
  template: '',
})
export abstract class AbstractListComponent extends AbstractComponent implements OnInit, OnDestroy {
  /** @hidden */ protected debug = true && AppConfig.debugEnabled;

  /** @hidden */
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
   * <ion-searchbar [(ngModel)]="search"></ion-searchbar>
   * ```
   * Usamos el texto de búsqueda para filtrar las filas a través del pipe en el componente de lista.
   * ```html
   * <ion-list *ngFor="let row of list.rows | filter:search:list.filter">
   * ```
   * @category Filter
   */
  search = undefined;

  /**
   * Estado actual del filtro. Se recuerda de la última llamada y se establece en la siguiente.
   *
   * Se puede definir el comportamiento del {@link FilterTypeComplex filtro} a través del modelo.
   * @category Filter
   */
  filter: any = undefined;

  /** Indica cuando, a pesar de añadir nuevos caracteres al texto de búsqueda y que el pipe a backend no sea requerido, si que debe filtrase el pipe localmente. */
  isLocalFilterStillRequired = undefined;

  /** @hidden Usada para filtrar propiedades en el template. */
  protected filterPipe = new FilterPipe();

  /** Filtro inicial que se establece directamente en la propiedad `search` del esquema durante la inicialización. */
  initialFilter: any = undefined;

  /** @hidden Permite notificar las nuevas búsquedas del usuario al componente. */
  pipeFilterChanged = new Subject<string>();

  /** @hidden */
  private pipeFilterChangedSubscription: Subscription;

  /**
   * Esta propiedad retiene el valor original de la propiedad `search` del modelo y la restablece al terminar.
   *
   * Tanto el filtro de _backend_ del _pipe_ (cuando `pipeToBackend` está en `true`) como el del componente de búsqueda accionado a través de una llamada a `showFilter()`
   * se combinan con el filtro original para establecer en el modelo unas condiciones para `search` que permitan realizar la consulta con los criterios seleccionados por el usuario durante la próxima llamada a `refresh()`.
   * @category Filter
   */
  protected originalSearch = undefined;

  /** @hidden Recordamos el último texto escrito por el usuario en el buscador. */
  private currentMatch: string = undefined;

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

  /** @hidden */
  private multiSelectModeChangedSubscription: Subscription;

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


  /** @hidden Recibimos notificaciones desde componentes de otros módulos a través del servicio. */
  createdSubscription: Subscription;
  /** @hidden Recibimos notificaciones desde componentes de otros módulos a través del servicio. */
  modifiedSubscription: Subscription;
  /** @hidden Recibimos notificaciones desde componentes de otros módulos a través del servicio. */
  deletedSubscription: Subscription;


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

  // ---------------------------------------------------------------------------------------------------
  //  Expose model for template
  // ---------------------------------------------------------------------------------------------------

  /** @category Model */ get entity(): EntityName { return this.model.name; }
  /** @category Model */ get primaryKey(): string { return this.model.primaryKey; }
  /** @category Model */ get detail(): EntityDetailSchema { return this.model.detail; }
  /** @category Model */ get list(): EntityListSchema { return this.model.list; }
  /** @category Model */ get headerText(): string { return this.model.list.headerText; }
  /** @category Model */ get addNewText(): string { return this.model.list.addNewText; }
  /** @category Model */ get loadingText(): string { return this.model.list.loadingText; }

  /** @hidden */
  scrolled = false;

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

    // Si se ha indicado un esquema en la ruta, prevalece al suministrado por el constructor de la clase heredada.
    if (this.route.snapshot.data.schema) {
      this.schema = this.route.snapshot.data.schema;
      this.model = new EntityModel(this.schema, this.translate);
    }
    // Establecemos el filtro para una consulta inicial.
    this.initialFilter = JSON.parse(this.route.snapshot.queryParams.filter || 'false');
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
    }

    // Creamos una consulta para este componente.
    this.query = this.service.registerQuery(this.model, this.queryKey);

    if (this.model.list.notifyCacheRow) {
      // Recibimos notificaciones desde otros componentes (incluso desde otros módulos) a través del servicio.
      this.createdSubscription = this.service.created.subscribe((data: RowModelType) => this.notifyCacheRow(data, 'insert'));
      this.modifiedSubscription = this.service.modified.subscribe((data: RowModelType) => this.notifyCacheRow(data, 'update'));
      this.deletedSubscription = this.service.deleted.subscribe((data: RowModelType) => this.notifyCacheRow(data, 'delete'));
    }

    // Al iniciar, recordamos el filtro original del modelo.
    this.originalSearch = this.list.search;
    if (this.debug) { console.log(this.constructor.name + '.ngOnInit() -> orginalSearch', JSON.stringify(typeof this.model.list.search === 'function' ? this.model.list.search(this) : this.model.list.search)); }
    // Antes de refrescar, miramos si hay un filtro definidio para backend...
    this.initializeFilter();
    // Establecemos la propiedad search del esquema para una consulta inicial.
    if (this.initialFilter) { this.list.search = this.combineOriginalClauses(this.initialFilter); }
    // Monitorizamos las nuevas búsquedas realizadas por el usuario (desde FilterPipe).
    this.pipeFilterChangedSubscription = this.pipeFilterChanged.subscribe((match: string) => this.pipeFilterToBackend(match));

    // Comprobamos la parametrización de la ruta.
    this.route.queryParams.pipe(first()).subscribe(params => {
      // Comprobamos si requiere notificación respetando una posible activación previa desde initializePickRow.
      this.isPickRowMode = params.pickRowNotify === undefined ? this.isPickRowMode : params.pickRowNotify === 'true';
      // Comprobamos si se pueden crear filas nuevas.
      this.canCreate = params.canCreate === undefined ? this.canCreate : params.canCreate === 'true';
      // Obtenemos el valor seleccionado.
      this.selected = params.selected === undefined ? this.selected : +params.selected;
    });

    // Recibimos notificaciones de la página contenedor a través del servicio.
    this.multiSelectModeChangedSubscription = this.service.multiSelectModeChanged.subscribe((data: any) => this.updateMultiSelectMode(data));

    // Mientras la paginación no se haya completado, cargaremos la siguiente.
    if (!this.query.paginationComplete) { this.beforeRefresh(); this.refresh(); }

  }

  /** @category Lifecycle */
  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.ngOnDestroy()'); }

    // Cancelamos las suscripciones a notificaciones.
    if (this.createdSubscription) { this.createdSubscription.unsubscribe(); }
    if (this.modifiedSubscription) { this.modifiedSubscription.unsubscribe(); }
    if (this.deletedSubscription) { this.deletedSubscription.unsubscribe(); }
    if (this.pipeFilterChangedSubscription) { this.pipeFilterChangedSubscription.unsubscribe(); }
    if (this.multiSelectModeChangedSubscription) { this.multiSelectModeChangedSubscription.unsubscribe(); }

    // Cancelamos la selección.
    if (this.isPickRowMode) { this.isPickRowMode = false; AbstractModelService.pickRowNotify.next(); }
    // Cancelamos el modo multiSelect.
    if (this.multiSelect) { this.closeMultiSelectMode(); }

    // Eliminamos las filas de la lista al salir.
    this.query.clear();

    // Al terminar, restablecemos el filtro original.
    this.list.search = this.originalSearch;
    if (this.debug) { console.log(this.constructor.name + '.ngOnDestroy() -> orginalSearch = ', JSON.stringify(typeof this.originalSearch === 'function' ? this.originalSearch(this) : this.originalSearch)); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Scroll to selected item
  // ---------------------------------------------------------------------------------------------------

  /** @hidden */
  defaultOrderByCallback(host?: any): void {
    if (!!host && host.isPickRowMode && host.selected && !host.scrolled) {
      // console.log('callback order !!!!!');
      host.scrolled = true;
      host.scrollToSelectedItem();
    }
  }

  scrollToSelectedItem(count?: number) {
    timer(500).pipe(first()).subscribe(observer => {
      if (this.isPickRowMode && this.selected) {
        let list = document.querySelector('div.modal-wrapper ion-list');
        if (!list) {
          const factory = this.resolver.resolveComponentFactory(this.constructor as any);
          const selector = factory.selector;
          list = document.querySelector(`${selector} ion-list`);
        }
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


  // ---------------------------------------------------------------------------------------------------
  //  find & refresh
  // ---------------------------------------------------------------------------------------------------

  /**
   * Establece las cláusulas de búsqueda en el modelo e inicia una operación de búsqueda.
   * @param combineOriginalClauses: Indica si las cláusulas se combinarán con las del filtro original.
   * @param combineSearchClauses: Indica si las cláusulas se combinarán con las del cuadro de texto escritas por el usuario.
   */
  protected find(clauses: any, options?: { combineOriginalClauses?: boolean, combineSearchClauses?: boolean }): Promise<any[]> {
    if (!options) { options = {}; }
    if (options.combineOriginalClauses === undefined) { options = { combineOriginalClauses: true }; }
    if (options.combineSearchClauses === undefined) { options = { combineSearchClauses: true }; }

    this.beforeRefresh();

    if (options.combineSearchClauses) { clauses = this.combineSearchClauses(clauses); }
    if (options.combineOriginalClauses) { clauses = this.combineOriginalClauses(clauses); }

    this.list.search = clauses;
    if (this.debug) { console.log(this.constructor.name + '.find()', this.list.search); }
    return this.refresh();
  }

  /** @hidden Combina las cláusulas con la búsqueda original. */
  protected combineOriginalClauses(clauses: ApiSearchClauses): ApiSearchClauses {
    // Obtenemos las cláusulas de la consulta original.
    const original = (typeof this.originalSearch === 'function' ? this.originalSearch(this) : this.originalSearch) || null;
    const searchOp = this.list.searchOR ? 'OR' : 'AND';
    // Combinamos el filtro original con el construido a partir de la búsqueda del usuario.
    const final: ApiSearchClauses = this.combineClauses(clauses, original, searchOp);
    if (this.debug) { console.log(this.constructor.name + '.combineOriginalClauses()', { original, final }); }
    return final;
  }

  /** @hidden Combina las cláusulas con la búsqueda del cuadro de texto escrita por el usuario. */
  protected combineSearchClauses(clauses: ApiSearchClauses): ApiSearchClauses {
    // Obtenemos las cláusulas de la consulta original.
    const search = this.buildPipeClauses(this.search);
    const searchOp = this.list.searchOR ? 'OR' : 'AND';
    // Combinamos el filtro original con el construido a partir de la búsqueda del usuario.
    const final: ApiSearchClauses = this.combineClauses(clauses, search, searchOp);
    if (this.debug) { console.log(this.constructor.name + '.combineOriginalClauses()', { search, final }); }
    return final;
  }

  /** Combina dos grupos de cláusulas con el operador indicado. */
  protected combineClauses(clausesA: ApiSearchClauses, clausesB: ApiSearchClauses, concatOp?: ConcatOperatorType): ApiSearchClauses {
    if (!concatOp) { concatOp = 'AND'; }
    if (Array.isArray(clausesA) && !clausesA.length) { clausesA = null; }
    if (Array.isArray(clausesB) && !clausesB.length) { clausesB = null; }
    if (!clausesA || !clausesB) { return clausesA || clausesB; }
    return concatOp === 'OR' ? { OR: [clausesA, clausesB] } : { AND: [clausesA, clausesB] };
  }

  /**
   * Función pensada para sobrescribir en la clase heredada que permite intervenir de forma
   * previa a todas las acciones de obtención de filas que acaban llamando a `refresh`.
   * Esto sucede desde las funciones: `find`, `nextPage`, `previousPage`, `pipeFilterToBackend`.
   */
  protected beforeRefresh(): void { return; }

  /**
   * Llamada a la función refresh() del servicio asociado.
   * @param $event: evento disparado por el componente `ion-infinite-scroll`.
   *
   * **Usage**
   * ```html
   * <ion-infinite-scroll (ionInfinite)="refresh($event)">
   * ```
   * <small>Es necesario pasar el evento como argumento para que el componente pueda diferenciar con las llamadas programáticas en las que borraría las filas primero.</small>
   * @category Query
   */
  refresh($event?: any, clearBefore?: boolean): Promise<any[]> {
    if (clearBefore === undefined) { clearBefore = false; }
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.refresh($event)  => ', { event: $event, clearBefore }); }
    return new Promise<any[]>((resolve: any, reject: any) => {
      // Establecemos el indicador de estado.
      this.loading = true;
      // Recordamos las filas seleccionadas.
      const cache: any[] = this.cachingSelectedRows ? this.rows.filter(row => row.checked) : null;
      if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + ' -> cache => ', cache); }
      // Refrescamos las filas de la entidad actual a través del servicio.
      this.service.refresh(this.query, { host: this, event: $event, clearBefore }).then(rows => {
        if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + ' -> this.service.refresh() => ', rows); }

        // Actualizamos las filas con la caché de filas seleccionadas.
        if (this.cachingSelectedRows) { this.refreshRowsWithCache(cache); }
        // Establecemos el indicador de estado.
        this.loading = false;
        // Nos situamos al principio de los resultados.
        if (!$event && !!this.content) { this.content.scrollToTop(); }
        // Devolvemos las filas creadas.
        resolve(rows);

      }).catch((error: any) => reject(error)).finally(() => this.loading = false);
    });
  }

  nextPage(): Promise<any[]> {
    const clearBefore = true;
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.nextPage()  => ', { event: {}, clearBefore }); }
    this.beforeRefresh();
    return this.refresh({ mock: true }, clearBefore);
  }

  previousPage(): Promise<any[]> {
    this.query.page -= 2;
    this.query.paginationComplete = false;
    const clearBefore = true;
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.previousPage()  => ', { event: {}, clearBefore }); }
    this.beforeRefresh();
    return this.refresh({ mock: true }, clearBefore);
  }


  // ---------------------------------------------------------------------------------------------------
  //  pipe to backend
  // ---------------------------------------------------------------------------------------------------

  /** @hidden Evalua cuando es necesario interrumpir el filtrado local para aplicarlo contra el _backend_. Se llama desde la clase `PipeFilter` antes de aplicar el filtro. */
  pipeToBackendRequired(match: string): boolean | 'local' {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    if (!filter.pipeToBackend) { return false; }

    const current = this.currentMatch;

    if (this.loading) {
      this.isLocalFilterStillRequired = false;
      // console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired => this.loading ', { match, current });
      return false;
    }
    if (match && current === undefined) {
      this.isLocalFilterStillRequired = false;
      // console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired => current === undefined ', { match, current });
      return true;
    }
    if (match === current) {
      // console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired => match === current ', { match, current });
      return this.isLocalFilterStillRequired ? 'local' : false;
      return false;
    }

    // Delay entre
    const buffer = match.substring(current.length);
    const words = matchWords(buffer);
    const startWithSpace = !!buffer && !!buffer[0].match(patterns.punctuation);
    // No actualizamos el valor actual hasta que el buffer no contenga almenos una palabra, de esta manera ignoramos los espacios y signos de puntuación.
    if (words.length > 0) { this.currentMatch = match; }
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.pipeToBackendRequired(match)', { current, match, buffer, words }); }
    // Si el buffer contiene palabras nuevas (es decir, empieza por un espacio o signos de puntuación y a continuación hay almenos una letra)
    if (startWithSpace && words.length === 1 || words.length > 1) { this.isLocalFilterStillRequired = false; return true; }
    // Si hay un valor actual y es una continuación de la escritura... y además no estamos en una consulta paginada... evitamos ir al backend.
    if (current && match.startsWith(current) && this.query.paginationComplete) { this.isLocalFilterStillRequired = true; return 'local'; }
    // Se requiere una llamada al backend.
    this.isLocalFilterStillRequired = false;
    return true;
  }

  /** @hidden Ejecuta la consulta contra el _backend_. */
  protected pipeFilterToBackend(match: string, options?: { extra?: any }): boolean {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    if (!filter.pipeToBackend) { return; }
    // if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.pipeFilterToBackend() -> filter = ', filter); }
    // Comprobamos que se han definido campos para la propiedad pipe.
    if (!filter || !filter.pipe) { throw new Error(`No se ha definido ningún campo en la propiedad 'pipe' para el filtro de backend del modelo '${this.model.name.plural}'.`); }
    if (!options) { options = {}; }
    if (options.extra === undefined) { options.extra = null; }

    this.beforeRefresh();
    // Combinamos las cláusulas extra.
    const clauses = this.combineSearchClauses(options.extra);
    // Combinamos el filtro original con el construido a partir de la búsqueda del usuario.
    this.list.search = this.combineOriginalClauses(clauses);
    // Recordamos el último texto introducido.
    this.currentMatch = match;
    // Realizamos la llamada al backend a través de la función del componente.
    this.refresh();
  }

  /** @hidden Construye las cláusulas search a partir del texto de búsqueda indicado. */
  protected buildPipeClauses(match: string): any {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    if (!filter.pipeToBackend) { return null; }
    // Comprobamos que se han definido campos para la propiedad pipe.
    if (!filter || !filter.pipe) { throw new Error(`No se ha definido ningún campo en la propiedad 'pipe' para el filtro de backend del modelo '${this.model.name.plural}'.`); }
    // Nos aseguramos que se trata de un array.
    const fields = typeof filter.pipe === 'string' ? ApiEntity.splitFields(filter.pipe) : filter.pipe;
    // Obtenemos los campos agrupados por entidad.
    const entities: ApiEntity[] = ApiEntity.joinFields(ApiEntity.parseFields(this.model.backend.plural, fields.map(f => f.replace(/\?/g, ''))));
    // Obtenemos las cláusulas con la búsqueda del usuario.
    const clauses = [];

    if (match) {
      // Iteramos las entidades para crear las cláusulas.
      !filter.splitPipeWords
        ? entities.map(entity => entity.columns.map(c => clauses.push([`${entity.table.name}.${c.name}`, 'LIKE', `%${match}%`])))
        : filter.concatPipeWords === 'OR'
          ? entities.map(entity => entity.columns.map(c => matchWords(match).map(w => clauses.push([`${entity.table.name}.${c.name}`, 'LIKE', `%${w}%`]))))
          // : entities.map(entity => entity.columns.map(c => clauses.push({ AND: [...matchWords(match).map(w => [`${entity.table.name}.${c.name}`, 'LIKE', `%${w}%`])]})))
          : matchWords(match).map(w => clauses.push({ OR: [].concat.apply([], entities.map(entity => entity.columns.map(c => `${entity.table.name}.${c.name}`))).map(field => [field, 'LIKE', `%${w}%`]) }) )
      ;
    }
    if (this.debug) { console.log(this.constructor.name + '.buildPipeClauses()', { splitPipeWords: filter.splitPipeWords, concatPipeWords: filter.concatPipeWords, clauses }); }
    return clauses.length ? { [!filter.splitPipeWords ? 'OR' : filter.concatPipeWords]: clauses } : null;
  }

  /**
   * Devuelve las palabras utilizadas para el filtro separadas por comas, resaltadas y saneadas para usar en la plantilla HTML.
   *
   * **Usage**
   *
   * ```html
   * <span *ngIf="search" [innerHTML]="searchWords()"></span>
   * ```
   * Para la búsqueda `Amsterdam Paris London` devuelve la siguiente expresión:
   * ```html
   * <span class="filtered">Amsterdam</span>, <span class="filtered">Paris</span> y <span class="filtered">London</span>
   * ```
   * @param replace Expresión html que se utiliza para envolver con tags las palabras buscadas y resaltarlas del resto del contenido. Si no se establece se utiliza por defecto `<span class="filtered">$1</span>`
   * @category Filter
   */
  searchWords(replace?: string): SafeHtml {
    if (!this.search) { return ''; }
    if (!replace) { replace = '<span class="filtered">$1</span>'; }
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    const concat = this.translate.instant(`search.${filter.concatPipeWords}`);
    // Remplazamos las palabras por tags coloreados.
    return !filter.splitPipeWords
      ? this.sanitizer.bypassSecurityTrustHtml(this.search.replace(/(.*)/, replace))
      : this.sanitizer.bypassSecurityTrustHtml(matchWords(this.search).map(w => w.replace(/(.*)/, replace)).join(',').replace(/,([^,]*)$/, ` ${concat} $1`).split(',').join(', '));
  }

  /**
   * Devuelve un contenido html con las ocurrencias del texto coloreadas.
   *
   * **Usage**
   * ```html
   * <text-colorized [value]="row.nombre" [search]="search"></text-colorized>
   * ```
   */
  colorMatch(text: string, match: string): SafeHtml {
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    // const pipe = new FilterPipe();
    if (!!match && this.filterPipe.filterProperty(text, match, { splitWords: filter.splitPipeWords })) {
      const { distinguishWords, maxDistinctions, ignoreAccents } = filter;
      return super.colorMatch(text, match, { splitWords: filter.splitPipeWords, distinguishWords, maxDistinctions, ignoreAccents });
    } else {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }

  filterProperty(value: any): boolean {
    if (!this.search) { return false; }
    const filter: FilterTypeComplex = this.list.filter as FilterTypeComplex;
    const { ignoreAccents, ignoreCase, splitPipeWords } = filter;
    // const pipe = new FilterPipe();
    return this.filterPipe.filterProperty(value, this.search, { ignoreCase,  ignoreAccents, splitWords: splitPipeWords });
  }


  // ---------------------------------------------------------------------------------------------------
  //  save
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



  // ---------------------------------------------------------------------------------------------------
  //  spliceRow . deleteRow
  // ---------------------------------------------------------------------------------------------------

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

  /**
   * Elimina la fila del backend y de la caché de la consulta administrada.
   * @category Row Action
   */
  async deleteRow(row: any): Promise<any> {
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.deleteRow(row) => ', { row, model: this.model }); }
    if (this.ionList) { await this.ionList.closeSlidingItems(); }
    return this.service.deleteRow(this.query, row, { host: this }).toPromise();
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
  //  select row mode
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
   * @category Select
   */
  set initializePickRow(data: any) {
    // console.log('initializePickRow => ', data);
    // Establecemos el indicador de estado.
    this.isPickRowMode = true;
    if (this.debug) { console.log('AbstractListComponent:' + this.constructor.name + '.initializePickRow(data) => ', data); }
    // if (this.debug) { console.log('typeof selected => ', typeof data.selected); }
    const { canCreate, isModal, isPopover, filter, ...extra } = data;
    // Establecemos el valor seleccionado actualmente (selected) y las propiedades extra.
    deepAssign(this, extra);
    // Establecemos el indicador de estado.
    if (canCreate !== undefined) { this.canCreate = !!canCreate; }
    if (isModal !== undefined) { this.isModal = !!isModal; }
    if (isPopover !== undefined) { this.isPopover = !!isPopover; }
    if (filter !== undefined) { this.initialFilter = filter; }
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
      this.checkedChanged.next(this.search ? this.countChecked() : this.checkedChanged.getValue() + (row.checked ? 1 : -1));

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
  //  group
  // ---------------------------------------------------------------------------------------------------

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
   * <ion-col *ngFor="let row of group.rows; trackBy: rowId">
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
      (groups as any).map(g => collapsed.push({ key: g.key, value: true }));
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
  //  filter
  // ---------------------------------------------------------------------------------------------------

  /** @hidden Inicializa el filtro con los valores del formulario del filtro definido en el modelo. */
  protected initializeFilter(): void {
    // Obtenemos la configuración del modelo.
    const filter: FilterType = this.model.list.filter;
    // Si existe un filtro para backend.
    if (typeof filter === 'object' && filter.hasOwnProperty('frm')) {
      // Comprobamos si se ha definido un formulario válido...
      const frm = (filter as FilterTypeComplex).frm; if (frm instanceof FormGroup) {
        // Obtenemos el valor para el filtro.
        this.filter = frm.value;
      }
    }
  }

  /**
   * Lanzamos un modal para presentar el componente de filtro para backend.
   *
   * **Usage**
   * ```html
   * <ion-icon (click)="showFilter()" name="search"></ion-icon>
   * ```
   * @category Filter
   */
  showFilter(options?: { component?: any, onInit?: (host: any) => any, onDismiss?: (host: any, data: any) => void }): void {
    // Obtenemos la configuración del modelo.
    const filter: any = this.model.list.filter;
    // Comprobamos las opciones.
    if (!options) { options = {}; }

    // Referenciamos la función de inicialización del filtro.
    let onInit = options.onInit || filter.onInit;
    // Comprobamos si se ha suministrado una función para la inicialización del modal.
    if (!onInit) {
      // Si no se ha suministrado ninguna la declaramos ahora.
      onInit = (host: any): any => {
        // Se requiere un host válido.
        if (!host || !host.hasOwnProperty('filter')) { throw new Error('Se requiere un host válido de la clase "AbstractListComponent".'); }
        // Establecemos el valor inicial para el filtro.
        return { filter: host.filter };
      };
    }

    // Referenciamos el callback.
    let onDismiss = options.onDismiss || filter.onDismiss;
    // Comprobamos si se ha suministrado una función para el callback del modal.
    if (!onDismiss) {
      // Si no se ha suministrado ninguna la declaramos ahora.
      onDismiss = (host: any, data: any): void => {
        // Recordamos el filtro actual para la próxima vez.
        host.filter = data;
        // Declaramos una función search para transferir el filtro a la consulta.
        host.model.list.search = (h: any): ApiSearchClauses => h.parseFilter();
        // Limpiamos la caché.
        host.query.restart();
        // Limpiamos la búsqueda del cuadro de texto.
        host.currentMatch = undefined; host.search = undefined;
        // Realizamos la llamada al backend a través de la función del componente.
        host.refresh();
      };
    }
    // Realizamos una carga dinámica del componente.
    this.resolveFactory(options.component || filter.component).then(component => {
      // Mostramos el modal.
      this.modal.create({
        component,
        componentProps: onInit(this),
      }).then(modal => {
        modal.onDidDismiss().then((detail: any): void => {
          if (detail && detail.data) { onDismiss(this, detail.data); }
        });
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
   * parseFilter(): ApiSearchClauses {
   *   // Obtenemos las cláusulas de la consulta original.
   *   const original = (typeof this.originalSearch === 'function' ? this.originalSearch(this) : this.originalSearch) || null;
   *   const clauses = { AND: [] };
   *   const list = this.query.model.list;
   *
   *   // Construimos las cláusulas a partir del valor del formulario SearchComponent.
   *   if (this.filter) {
   *     if (this.filter.hasOwnProperty('year')) {
   *       clauses.AND.push(['YEAR(pedidos.date_add)', '=', +this.filter.year]);
   *     }
   *     if (this.filter.hasOwnProperty('month') && this.filter.month > 0) {
   *       clauses.AND.push(['MONTH(pedidos.date_add)', '=', +this.filter.month]);
   *     }
   *   }
   *   // Combinamos el filtro original con el construido a partir de la búsqueda del usuario.
   *   return !clauses.AND.length ? original : original ? { AND: [original, clauses] } : clauses;
   * }
   * ```
   * @category Filter
   */
  parseFilter(): ApiSearchClauses {
    const searchOp = this.list.searchOR ? 'OR' : 'AND';
    const clauses: ApiSearchClause[] = [];

    // Construimos las cláusulas a partir del valor del formulario SearchComponent.
    if (this.filter) {
      for (const field of Object.keys(this.filter)) {
        const value = this.filter[field];
        // Ignoramos los valores nulos.
        if (value !== null) { clauses.push([field, '=', value]); }
      }
    }

    // Combinamos el filtro original con el construido a partir de la búsqueda del usuario.
    return this.combineOriginalClauses(clauses.length ? (searchOp === 'OR' ? { OR: clauses } : { AND: clauses }) : null);
  }

  /**
   * Indica cuando se está aplicando un filtro local sobre los resultados obtenidos del backend.
   * Para ello debe haber un texto escrito en el cuadro de búsqueda y el filtro debe tener la propiedad `pipeToBackend` establecida en `false`.
   *
   * **Usage**
   *
   * Construimos el texto que se muestra al usuario informéndole a cerca de los resultados.
   * ```html
   * <p>{{isLocalFiltered ? 'Filtrados' : 'Resultados:'}} <b>{{isLocalFiltered ? filtered.length : ''}}</b> {{isLocalFiltered ? 'de' : ''}} <b>{{rows.length}}</b></p>
   * ```
   * @category Filter
   */
  get isLocalFiltered(): boolean {
    return this.search && !(this.list.filter as FilterTypeComplex).pipeToBackend;
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
    const filtered = checkeable.filter(row => pipe.applyFilter(row, this.currentMatch, this.model.list.filter, { ignoreChecked: false }));
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
    return this.multiSelect && typeof this.multiSelect.checkable === 'function' ? this.multiSelect.checkable(row, this) : true;
  }

  /** @hidden Devuelve el número de filas actualmente seleccionadas. */
  protected countChecked(): number {
    return this.rows && this.rows.length ? this.rows.filter(row => this.isCheckable(row) && !!row.checked).length : 0;
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
    if (this.debug) { console.log(this.constructor.name + '.refreshRowsWithCache()', cache); }
    // Iteramos las filas de la caché.
    cache.forEach(row => {
      // Buscamos la fila en la lista actual.
      const idx = this.findIndex(row, this.rows);
      if (idx > -1) {
        // Si ya existe, la marcamos como seleccionada.
        this.rows[idx].checked = true;
        if (this.debug) { console.log(this.constructor.name + '.refreshRowsWithCache() -> mark row as checked', this.rows[idx]); }

      } else {
        // Si no existe, la añadimos ahora.
        this.rows.push(row);
        if (this.debug) { console.log(this.constructor.name + '.refreshRowsWithCache() -> add row to collection', row); }
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
