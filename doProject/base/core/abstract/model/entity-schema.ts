import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

import { ApiFieldsType, ApiSearchClauses, ConcatOperatorType, OrderByDirectionType, OrderByTypeComplex } from 'src/core/api';

import { EntityName, EntityModel } from './entity-model';
import { EntityQuery } from './entity-query';


/** Agrupa los diferentes tipos de entidad. */
export type EntityType = EntityName | EntitySchema | EntityModel | EntityQuery;


// ---------------------------------------------------------------------------------------------------
//  RowHookFunction
// ---------------------------------------------------------------------------------------------------

export type RowHookSyncFunction = ((row: any, host: any) => any);
export type RowHookAsyncFunction = ((row: any, host: any) => Observable<any>);
export type RowHookFunction = RowHookSyncFunction | RowHookAsyncFunction;


// ---------------------------------------------------------------------------------------------------
//  FilterType . FilterTypeComplex
// ---------------------------------------------------------------------------------------------------

/**
 * Define un filtro compatible con la clase _FilterPipe_.
 *
 * **Usage**
 * ```html
 * <ion-item button *ngFor="let row of rows | filter:match:list.filter">
 * ```
 *
 * ```typescript
 * // Filtrar por una columna de la fila con valores primitivos.
 * filter: 'numero'
 * // Múltiples columnas.
 * filter: 'numero, emision'
 * // Múltiples columnas.
 * filter: ['numero', 'emision']
 * // Campos foráneos en notación API Rest.
 * filter: 'cliente(nombre, nif)'
 * // Campos foráneos en notación DataPath.
 * filter: 'cliente.nombre'
 * // No generar errores cuando faltan propiedades.
 * filter: 'cliente?.nombre'
 * ```
 * <br />
 * Ver la interface `FilterTypeComplex` para establecer filtros complejos aplicables también sobre las consultas de backend.
 */
export type FilterType = string | string[] | FilterTypeComplex;

/**
 * Estructura de datos para definir un filtro que se aplica sobre los resultados del front-end y que es compatible con la clase _FilterPipe_ al mismo tiempo que
 * permite definir un filtro para el _backend_. También permite definir el modelo del formulario para el componente _AbstractSearchComponent_.
 *
 * #### PreFiltro para el _front-end_
 *
 * Para definir un pre-filtro en combinación con la clase _FilterPipe_ usamos un objeto literal con las siguientes propiedades:
 * ```typescript
 * filter: {
 *   // Acepta cualquier fórmula de las definidas en FilterType como string o string[].
 *   pipe: string | string[],
 *   // Filtra los elementos de la lista antes de aplicar el pipe.
 *   preFilter?: ((row: any, host: any) => boolean),
 * };
 * ```
 *
 * Por ejemplo, si queremos seleccionar únicamente los servicios facturables:
 * ```typescript
 * filter: {
 *   pipe: 'numero, emision, cliente(nombre, nif)',
 *   preFilter: (row: any, host: any) => !host.facturarMode || host.canFacturar(row),
 * },
 * ```
 * <br />
 *
 * #### Filtro para el _backend_
 *
 * Para definir un filtro para el backend existen dos maneras que pueden usarse de forma complementaria:
 *
 * 1. Capturando la escritura del usuario en el cuadro de búsqueda.
 *
 *    ```html
 *    <ion-searchbar [(ngModel)]="search" debounce="500">
 *    ```
 *    Aplicando el filtro a través de la clase `FilterPipe`.
 *    ```html
 *    <ion-item button *ngFor="let row of rows | filter:match:list.filter">
 *    ```
 *    Estableciendo la propiedad `pipeToBackend` a `true` las búsquedas del usuario se transforman en consultas hacia el backend.
 *    ```typescript
 *    filter: {
 *      pipeToBackend: true,
 *      pipe: 'numero, emision, cliente(nombre, nif)',
 *    },
 *    ```
 *    El componente combina las cláusulas con el filtro original de la propiedad `search` del modelo y llama a `request()` automáticamente.
 *    ```typescript
 *    { OR: [
 *      ['numero', 'LIKE', '%Joe%'],
 *      ['emision', 'LIKE', '%Joe%'],
 *      ['cliente.nombre', 'LIKE', '%Joe%'],
 *      ['cliente.nif', 'LIKE', '%Joe%'],
 *    ]},
 *    ```
 * <br />
 *
 * 2. Consultar al usuario a través de un formulario.
 *
 *    ```html
 *    <ion-button (click)="showAdvancedSearch()">
 *    ```
 *    El componente utiliza la función {@link AbstractListComponent.parseAdvancedSearch parseAdvancedSearch}() que combina las cláusulas del formulario de búsqueda con las del filtro original del modelo y llama a `request()` automáticamente.
 *    Para manejar formularios complejos se puede sobrescribir la función `parseAdvancedSearch()` en la clase heredada de {@link AbstractListComponent}.
 *    ```typescript
 *    filter: {
 *      component: 'ServiciosSearchComponent',
 *      frm: new FormGroup({
 *        year: new FormControl('', Validators.required),
 *        month: new FormControl(),
 *      }),
 *    };
 *    ```
 *    También se puede definir una nueva función {@link onDismiss()} en el modelo para remplazar el comportamiento por defecto.
 */
export interface FilterTypeComplex {
  /** Referencia al componente AbstractListComponent que hospeda el modelo en este momento. */
  host?: any;

  /**
   * Realiza un pre filtro de las filas antes de ser sometidas al filtro del pipe.
   *
   * Por ejemplo, si queremos seleccionar únicamente los servicios facturables:
   *
   * ```typescript
   * filter: {
   *   preFilter: (row: any, host: any) => !host.facturarMode || host.canFacturar(row),
   * },
   * ```
   * @category Filter
   */
  preFilter?: ((row: any, host: any) => boolean);

  /**
   * Definición del filtro compatible con la clase _FilterPipe_.
   *
   * Ver la definición del tipo {@link FilterType}
   * para obtener más información sobre como definir el filtro.
   * @category Filter
   */
  pipe?: string | string[];

  /**
   * Indica si se ignorarán mayúsculas y minúsculas durante la búsqueda.
   *
   * @default `true`.
   * @category Filter
   */
  ignoreCase?: boolean;

  /**
   * Indica si se ignorarán las letras con acentos durante la búsqueda.
   *
   * @default `true`.
   *
   * **NOTA**: La función `String.normalize()` solo es compatible con navegadores que soportan `ECMAScript v.6`
   * @category Filter
   */
  ignoreAccents?: boolean;

  /**
   * Indica la forma como el pipe tratará el texto introducido por el usuario en el buscador.
   *
   * Si se establece en `true` se ignoran todos los carácteres de puntuación y las palabras se tratan por separado,
   * mientras que si se establece en `false` el texto se trata como una unidad.
   *
   * @default `true`
   *
   * Ver las propiedades {@link FilterTypeComplex.concatPipeWords concatPipeWords},
   * {@link FilterTypeComplex.distinguishWords distinguishWords} y
   * {@link FilterTypeComplex.maxDistinctions maxDistinctions}
   * para obtener más información acerca de como se concatenan las cláusulas obtenidas.
   * @category Filter
   */
  splitPipeWords?: boolean;

  /**
   * Si la propiedad {@link FilterTypeComplex.splitPipeWords splitPipeWords}
   * se establece en `true`, entonces indica como se concatenan las cláusulas
   * generadas por cada palabra del texto introducido por el usuario en el buscador.
   *
   * @default `OR`
   *
   * Ejemplo de concatenación `OR`:
   * ```typescript
   * { OR: [
   *   ["address.street", "LIKE", "%London%"],
   *   ["address.street", "LIKE", "%Paris%"],
   *   ["address.city", "LIKE", "%London%"],
   *   ["address.city", "LIKE", "%Paris%"],
   * ]}
   * ```
   *
   * Ejemplo de concatenación `AND`:
   * ```typescript
   * { AND: [
   *   { OR: [
   *     ["address.street", "LIKE", "%London%"],
   *     ["address.city", "LIKE", "%London%"],
   *   ]},
   *   { OR: [
   *     ["address.street", "LIKE", "%Paris%"],
   *     ["address.city", "LIKE", "%Paris%"],
   *   ]},
   * ]}
   * ```
   *
   * @category Filter
   */
  concatPipeWords?: ConcatOperatorType;

  /**
   * Indica si las palabras se marcan con clases diferenciadas (además de la clase `filtered`) para poder aplicarles diferentes colores.
   * Estas clases adicionales siguen la fórmula `filtered-word-N`, donde `N` es un valor que va desde `1` hasta el máximo número de
   * distinciones dado por la propiedad `maxDistinctions`.
   *
   * Esta propiedad se aplica únicamente cuando la propiedad `splitPipeWords` se establece en `true`.
   *
   * @default `true`
   * @category Filter
   */
  distinguishWords?: boolean;

  /**
   * Indica el número máximo de colores que se distinguirán.
   *
   * Por ejemplo, si se establece en `3`, la primera palabra se marcará con la clase `filtered-word-1`, la segunda con `filtered-word-2`
   * y la tercera con `filtered-word-3`. A partir de la cuarta palabra se utilizará de nuevo la misma clase que para la primera;
   * para la quinta se utilizará la misma que la segunda y así sucesivamente.
   *
   * @default `3`
   *
   * Esta propiedad se aplica únicamente cuando las propiedades {@link FilterTypeComplex.splitPipeWords splitPipeWords}
   * y {@link FilterTypeComplex.distinguishWords distinguishWords} se establecen en `true`.
   *
   * @category Filter
   */
  maxDistinctions?: number;

  /**
   * Inidica si el filtro escrito por el usuario se aplica en el front-end o se pasa directamente al backend.
   * @default `false`
   * @category Filter
   */
  pipeToBackend?: boolean;

  /**
   * Nombre del componente heredado de la clase _AbstractSearchComponent_ que hospeda el formulario para definir la consulta.
   * @category Filter
   */
  component?: string;

  /**
   * Formulario para definir la consulta.
   * @category Filter
   */
  frm?: FormGroup;

  /**
   * Se llama durante la creación del modal para inicializar el componente.
   *
   * Definición por omisión de la función:
   *
   * ```typescript
   * onInit = (host: any): any => {
   *   // Se inicializa la propiedad 'filter' del componente de búsqueda con la del host.
   *   return { advancedSearch: host.advancedSearch };
   * };
   * ```
   * @category Filter
   */
  onInit?: (host: any) => any;

  /**
   * Se llama durante el cierre del modal para devolver el valor seleccionado por el usuario.
   *
   * Definición por omisión de la función:
   *
   * ```typescript
   * onDismiss = (host: any, data: any): void => {
   *   // Recordamos el filtro actual para la próxima vez.
   *   host.advancedSearch = data;
   *   // Declaramos una función search para transferir el filtro a la consulta.
   *   host.model.list.search = (h: any): ApiSearchClauses => h.parseAdvancedSearch();
   *   // Limpiamos la caché.
   *   host.query.restart();
   *   // Realizamos la llamada al backend a través de la función del componente.
   *   host.request();
   * };
   * ```
   *
   * Si se utiliza la función `onDismiss` por defecto, entonces se sobrescribe la propiedad
   * {@link EntityListSchema.search search} para poder transferir el filtro a la consulta a través de la función
   * {@link AbstractListComponent.parseAdvancedSearch parseAdvancedSearch}():
   *
   * ```typescript
   * search: (host: any): ApiSearchClauses => host.parseAdvancedSearch()
   * ```
   * @category Filter
   */
  onDismiss?: (host: any, data: any) => void;
}


// ---------------------------------------------------------------------------------------------------
//  GroupByType . GroupByTypeComplex
// ---------------------------------------------------------------------------------------------------

/**
 * Define una agrupación compatible con la clase _GroupByPipe_.
 *
 * **Usage**
 *
 * ```html
 * <ion-item button *ngFor="let row of rows | groupBy:list.groupBy">
 * ```
 *
 * Valores posibles para establecer el _GroupByPipe_ en el front-end:
 * ```typescript
 * // Agrupar por una columna de la fila con valores primitivos.
 * groupBy: 'fecha'
 * // Campos foráneos en notación DataPath.
 * groupBy: 'parent.fecha'
 * // Usar una función para la obtención del valor de grupo de la fila.
 * groupBy: (row: any, host: any) => moment(row.fecha).format('YYYY-MM-DD')
 * ```
 * <br />
 * Ver la interface `GroupByTypeComplex` para establecer filtros complejos aplicables también sobre las consultas de backend.
 */
export type GroupByType = string | ((row: any, host: any) => any) | GroupByTypeComplex;

/**
 *
 */
export interface GroupByTypeComplex {
  /** Referencia al componente AbstractListComponent que hospeda el modelo en este momento. */
  host?: any;

  /**
   * Define un campo para la agrupación de las filas a través del pipe GroupByPipe.
   *
   * **Usage**
   *
   * ```html
   * <ion-list *ngFor="let row of rows | groupBy:list.groupBy">
   * ```
   *
   * Posibles valores:
   *
   * ```typescript
   * // Agrupar por una columna de la fila con valores primitivos.
   * groupBy: 'fecha'
   * // Campos foráneos en notación DataPath.
   * groupBy: 'parent.fecha'
   * // Usar una función para la obtención del valor de grupo de la fila.
   * groupBy: (row: any, host: any) => moment(row.fecha).format('YYYY-MM-DD')
   * ```
   * @category Query
   */
  property: string | ((row: any, host: any) => any);
}

// ---------------------------------------------------------------------------------------------------
//  PickRow
// ---------------------------------------------------------------------------------------------------

/**
 * Indica las opciones para seleccionar una fila o valor en un componente de lista.
 *
 * ```typescript
 * this.service.pickRow({ component: MisDireccionesListComponent, title: 'mis_direcciones.select_direccion' });
 * ```
 */
export type PickRowOptions = {
  /** Indica la forma como se muestra el componente de lista AbstractListMode. */
  mode?: 'modal' | 'action-sheet' | 'picker' | 'popover' | 'popover-picker' | 'navigation';
  isModal?: boolean,
  isPopover?: boolean,
  /** Referencia a la importación del componente cuando el modo es `modal` */
  component?: any;
  /** Indica una ruta de navegación para el componente de lista cuando el modo es `navigation`. */
  route?: string;
  /** Establece el valor inicialmente seleccionado en el componente de lista. */
  selected?: any,
  /** Transmite un filtro a la consulta realizada por el componente. */
  filter?: ApiSearchClauses,
  /** Parámetros adicionales. Si posteriomente hay que navegar se transmiten a queryParams. */
  params?: { [key: string]: any };
  /** Define las propiedades que se inicializarán del componente de listado. */
  initialize?: { [key: string]: any };
  /** Indica si se podrán crear nuevas filas durante el modo picRow. Por defecto es `false`. */
  canCreate?: boolean;
  /** Establece el título de la página o del componente de lista. */
  title?: string;
  /** Estilos del componente. */
  cssClass?: string | string[];
};

/** Estructura de datos para las notificaciones del modo pickRow. */
export interface PickRowNotificationType {
  model: EntityModel;
  row: any;
}

// ---------------------------------------------------------------------------------------------------
//  RowModelType
// ---------------------------------------------------------------------------------------------------

export interface RowModelType {
  entity: string | EntityType;
  row: any;
}


// ---------------------------------------------------------------------------------------------------
//  MultiSelectType
// ---------------------------------------------------------------------------------------------------

/**
 * Define un modo para la selección de los items de una lista.
 *
 * ```typescript
 * multiSelectModes: [
 *   {
 *     name: 'facturar', multi: true, icon: 'newspaper', color: 'primary',
 *     checked: 'checkmark-circle', unchecked: 'radio-button-off',
 *     checkable: ((row: any, host: any) => host.canFacturar(row)),
 *   }
 * ]
 * ```
 *
 * Los modos de selección múltiple se declaran en el modelo a través de la propiedad {@link EntityListSchema.multiSelectModes multiSelectModes}
 *
 */
export interface MultiSelectType {
  /** Nombre del modo y de la función del servicio asociado. */
  name: string;
  /** Indica si el modo acepta la selección múltiple. */
  multi: boolean;
  /** Icono que representa el modo. */
  icon: string;
  /** Color del icono que acompaña a los items de la lista para indicar cuando están o no seleccionados. */
  color: string;
  /** Nombre del icono que acompaña a los items de la lista para indicar cuando están seleccionados. */
  checked: string;
  /** Nombre del icono que acompaña a los items de la lista para indicar cuando están pendientes de selección. */
  unchecked: string;
  /** Función para filtrar las filas que deben aparecer en la lista cuando el modo se ha activado. */
  checkable?: (row: any, host: any) => boolean;
  /** Función para indicar los modos habilitados. Si no se establece, por defecto el modo queda hailitado. */
  enabled?: boolean | ((row: any, host: any) => boolean);
}


// ---------------------------------------------------------------------------------------------------
//  TabsPageSchema
// ---------------------------------------------------------------------------------------------------

export interface TabPageSchema {
  name: string | EntityName;
  label: string;
  default?: boolean;
}

export interface TabsPageSchema {
  name: string | EntityName;
  title?: string;          // default: name.singular + '.title'
  tabs: (TabPageSchema | EntitySchema)[];
}

/** Define una página con tabuladores que anida diferentes componentes de lista. */
export abstract class TabsPageSchema {

  /** Establece los valores por defecto en las propiedades no inicializadas. */
  static resolve(schema: TabsPageSchema): TabsPageSchema {
    // string -> EntityName
    if (typeof schema.name === 'string') { schema.name = EntityName.resolve(schema.name); }
    // Propiedades de la página.
    if (schema.title === undefined) { schema.title = `${schema.name.plural}.title`; }

    // Tabs.
    const tabs: TabPageSchema[] = [];
    for (const tab of schema.tabs) {
      let tabName: EntityName;
      if (tab.hasOwnProperty('name') && tab.hasOwnProperty('label')) {
        // TabPageSchema
        const tabPage: TabPageSchema = tab as TabPageSchema;
        tabPage.name = EntityName.resolve(tabPage.name);
        if (tabPage.label === undefined) { tabPage.label = `${schema.name.singular}.${tabPage.name.plural}`; }
        if (tabPage.default === undefined) { tabPage.default = false; }
        tabs.push(tabPage);

      } else if (tab.hasOwnProperty('name')) {
        // EntitySchema
        const entity: EntitySchema = EntityModel.resolveSchema(tab as EntitySchema);
        tabName = EntityName.resolve(entity.name);
        const tabFriendly = EntityName.resolve(entity.friendly);
        tabs.push({
          name: tabName,
          label: `${schema.name.plural}.${tabFriendly.plural}`,
          default: false,
        });
      }
    }
    schema.tabs = tabs;
    return schema;
  }
}


// ---------------------------------------------------------------------------------------------------
//  EntitySchema . EntityDetailSchema . EntityListSchema
// ---------------------------------------------------------------------------------------------------

export interface ConfirmMessage {
  confirm: boolean;
  header: string;
  message: string;
}

/**
 * Representa una entidad del modelo de datos.
 *
 * *Example:*
 * ```typescript
 * export const ServiciosSchema: EntitySchema = {
 *   name: 'servicios',
 *   list: {
 *     fields: 'taxista(nombre,apellidos,telefono->telefono,licencia)',
 *     foreign: {
 *       idtaxista: { taxista: 'nombre,apellidos,telefono->telefono,licencia' }
 *     },
 *     filter: {
 *       pipe: 'taxista(nombre,apellidos,licencia)',
 *       component: 'ServiciosSearchComponent',
 *       frm: new FormGroup({
 *         month : new FormControl(),
 *         year : new FormControl(),
 *       }),
 *     },
 *     orderBy: '-recogida,-tipo',
 *     dependencies: { auth: AuthService },
 *     search: (host: any): ApiSearchClauses => ({AND: [
 *       ['idUser', '=', host.user.idreg],
 *       { OR: [
 *         ['estado', '<=', SERVICIO_ACEPTADO],
 *         ['estado', '=', SERVICIO_EN_CURSO],
 *         ['estado', '=', 8],
 *       ]}
 *     ]}),
 *   }
 * };
 * ```
 * @category Entity
 */
export class EntitySchema {

  /** Identificador de la entidad en singular y plural.
   * @Default _singular = plural triming last 's'_
   */
  name: EntityName | string;

  /** Nombre para referirse a la entidad de la api.
   * @Default _entity.name.singular_
   */
  backend?: EntityName | string;

  /** Nombre amigable para mostrar en la interfaz de usuario (títulos, mensajes, etc).
   * @Default _entity.name_
   */
  friendly?: EntityName | string;

  /** Indica el nombre del campo de la clave primaria de la entidad.
   * <br /><br />In order to change the default value, you can implement de schema resolver in `src/app/model.ts`:
   * ```typescript
   * export const SchemaResolvers = {
   *   primaryKey: (entity: EntityName) => `id_${entity.singular}`,
   * };
   * ```
   * @Default `idreg`
   */
  primaryKey?: string;

  /** Indica los campos de auditoria.
   *
   * @default { updated: 'updated', deleted: 'deleted' }
   */
  auditFields?: { updated?: string, deleted?: string };

  /**
   * Indicates whether the loader should be displayed during backend calls.
   * This value will be overridden if you provide a value for detail or list schemas
   * @Default `false`
   */
  showLoader?: boolean;

  /** Indica si el componente de lista debe realizar una precarga de la fila de detalle antes de navegar hacia el componente de detalle.
   * @Default `true`
   */
  preload?: boolean;

  /** Ficha de detalle de la entidad.  */
  detail?: EntityDetailSchema;

  /** Lista de filas de la entidad. */
  list?: EntityListSchema;

}


/**
 * Define el modelo para un componente de detalle.
 * @category Entity
 */
export interface EntityDetailSchema {

  /** Prefijo para enrutar las cadenas de traducción.
   * @Default _friendly.singular_
   * @category Customized message
   */
  translatePrefix?: string;

  /**
   * Texto para el ion-title de la ficha de la entidad.
   * > El texto se traduce automáticamente.
   * @category Customized messages
   */
  headerText?: string;

  /**
   * Indicates whether the loader should be displayed during backend calls.
   * If this value is set, the general value of the scheme will be omitted.
   * @Default `true`
   */
  showLoader?: boolean;

  /**
   * Indicates the text that will be displayed during the call.
   * If this value is set, the general value of the scheme will be omitted.
   */
  loaderText?: string;

  /**
   * Indica la ruta de acceso a la ficha de la entidad. Si no se establece se obtiene de _schema.name.singular_. Ej: `conductor/:id`
   *
   * Para más información, consultar la resolución de rutas desde la función {@link EntityModel.resolveRoute resolveRoute}
   * de la clase `EntityModel`.
   */
  route?: string | ((row: any, host: any) => any[]);

  /**
   * Establece parámetros adicionales a la URL de navegación.
   *
   * El argumento `parent` hace referencia al componente que inicia la navegación, es decir, el componente de listado.
   *
   * ```typescript
   * // NOTA: El idCliente puede llegar por queryParams (si se ha navegado) o por inicialización de propiedades extra (si se ha abierto como modal)
   * queryParams: (row: any, parent: any) => ({ idCliente: parent.route.snapshot.queryParams.idCliente || parent.idCliente }),
   * ```
   */
  queryParams?: (row: any, parent: any) => { [key: string]: any };

  /** Navigate back after save action.
   * @category Row Action
   */
  navigateBackOnSave?: boolean;

  /** Navigate back after delete action.
   * @category Row Action
   */
  navigateBackOnDelete?: boolean;

  /** Shows an alert requesting confirmation from the user.
   * ```typescript
   * interface ConfirmMessage { confirm: boolean; header: string; message: string; }
   * ```
   *
   * @Default true
   * @category Row Action
   */
  confirmDelete?: boolean | ConfirmMessage;

  /** Indica si la fila se tomará de la caché o del backend.
   * @Default true
   */
  cache?: boolean;

  /**
   * Indica la forma de obtener el identificador de la fila.
   *
   * <br />
   *
   * **Usage**
   *
   * Diferentes formas de suministrar el identificador de la fila:
   *
   * ```typescript
   * // Un número harcoded, por ejemplo 1, para obtener la única fila de la tabla de configuración.
   * id: number
   * // La fila es nueva. Se establece literalmente en la url enviada a la API.
   * id: 'new'
   * // Párametro de la ruta ActiveRoute->paramsMap. @Default
   * id: { param: string }
   * // Función síncrona.
   * id: host => number | 'new'
   * // Función asíncrona.
   * id: host => Observable<number | 'new'>
   * ```
   * <br />
   *
   * Veamos algunos ejemplos:
   *
   * - Establecer un número de fila *harcoded* de tipo `number`. Por ejemplo, 1 para recuperar la configuración de la app o la info de la empresa que suelen ser filas únicas en sus respectivas tablas.
   *
   *   ```typescript
   *   id: 1
   *   ```
   *   <br />
   *
   * - Obtener el número de fila de un parámetro de la url.
   *
   *   ```typescript
   *   // Obtiene el id del parámetro de la ruta actual:
   *   id: { param: 'id' }
   *   ```
   *   <br />
   *
   * - Obtener el número de fila a través de una función suministrada (se le inyecta el servicio que actúa como host).
   *
   *   ```typescript
   *   // Función que accede síncronamente al valor y lo devuelve al instante.
   *   id: host => host.user.idreg
   *   // Función que accede asíncronamente al valor y devuelve un observable.
   *   id: host => host.user.get().pipe(mergeMap(user => of(user.idreg))
   *   id: host => new Observable<any>( observer => host.user.get().subscribe(user => observer.next(user.idreg)) )
   *   ```
   * @Default `{ param: 'id' }`
   */
  id?: number | 'new' | { param: string } | ((host: any) => number | 'new') | ((host: any) => Observable<number | 'new'>);

  /**
   * Lista de dependencias que se inyectarán en el componente durante el constructor de su clase base.
   * Algunas de las clases abstractas cargan propiedades de tipo función del modelo durante el constructor.
   * Si pretendemos hacer uso de servicios no suministrados por la clase base, de nada nos servirá inyectarlos
   * desde la clase heredada ya que su constructor se ejecuta después que el constructor de la clase base,
   * por lo que los servicios no estarán disponibles durante el acceso a las propiedades de tipo función.
   *
   * Un ejemplo típico es intentar obtener el id de la fila a través de una función que requiere de acceso a un servicio.
   * Por ejemplo, acceder al id del usuario que se obtiene del sotrage a través del servicio AuthService.
   *
   * ```typescript
   * // Indicamos la dependencia del servicio 'AuthService' que será inyectado por el componente (host).
   * detail: {
   *   id: host => host.user.idreg,
   *   dependencies: { auth: AuthService }
   * }
   * ```
   */
  dependencies?: any;

  /**
   * Lista de campos para la url de la consulta al backend.<br />
   * Si no se establece, entonces se recuperan todos los campos de la entidad principal.
   *
   * ```typescript
   * fields?: string | { [key: string]: string; } | (string | { [key: string]: string; })[]
   * ```
   *
   * - Las entidades foráneas se pueden definir a través del campo `fields`, como por ejemplo `usuasios?fields=nombre,apellidos,empresa(nombre)`,
   *   o también a través de la propiedad `foreign`. No hace falta repetirlas en ambas propiedades del modelo y siempre es preferible usar la propiedad `fields`.
   * - Usaremos la propiedad `foreign` en lugar de `fields` cuando queramos seleccionar la fila padre en el formulario de ficha a través de la función `select`.
   *
   * **Usage**
   * ```typescript
   * // Los campos se expresan separados por comas:
   * fields: 'nombre,apellidos,nif'
   * // También se pueden expresar mediante un array:
   * fields: ['nombre','apellidos','nif']
   * // Si queremos recuperar campos de entidades padre (en notación API Rest):
   * fields: 'tarifa(descripcion,importe),empresa(nombre)'
   * // O bién en notación DataPath:
   * fields:'tarifa.descripcion,tarifa.importe,empresa.nombre'
   * // También se pueden expresar como un objeto:
   * fields: {
   *   'poblacion->origen(idorigen)': 'nombre',
   *   'poblacion->destino(iddestino)': 'nombre',
   * }
   * ```
   * @category Query
   */
  fields?: ApiFieldsType;

  /**
   * Información adicional foránea de la fila actual.
   *
   * ```typescript
   * foreign?: { [key: string]: { [key: string]: string | ((row: any) => any) | ((row: any) => Observable<any>) } }
   * ```
   *
   * - Las entidades foráneas se pueden definir a través del campo `fields`, como por ejemplo `usuasios?fields=nombre,apellidos,empresa(nombre)`,
   *   o también a través de la propiedad `foreign`. No hace falta repetirlas en ambas propiedades del modelo y siempre es preferible usar la propiedad `fields`.
   * - Usaremos la propiedad `foreign` en lugar de `fields` cuando queramos seleccionar la fila padre en el formulario de ficha a través de la función `select`.
   *
   * ```typescript
   * // Indicamos el nombre de la propiedad de la que tomar el valor foráneo.
   * foreign: { idempresa: { empresa: 'nombre' } }
   * // Si indicamos varias propiedades obtendremos un objeto como valor foráneo.
   * foreign: { idUser: { usuario: 'nombre,apellidos' } }
   * ```
   *
   * ```typescript
   * // La linea del ejemplo anterior también se puede expresar usando una función `RowHookFunction`.
   * foreign: { idUser: { usuario: row => { nombre: row.nombre, apellidos: row.apellidos } }
   * // Devolvemos un valor primitivo resultado de concatenar el valor de varias propieades.
   * foreign: { idUser: { usuario: row => row.nombre + ' ' + row.apellidos }
   * // Devolvemos la fila foránea entera.
   * foreign: { idUser: { usuario: row => row }
   * ```
   *
   * ```typescript
   * // Usamos alias para la entidad cuando varias claves foráneas apuntan a la misma entidad padre.
   * foreign: {
   *   recogidaIdUbicacion: {
   *     'ubicacion->recogidaUbicacion(recogidaIdUbicacion)': '-direccion_original',
   *     'poblacion(recogidaUbicacion.idPoblacion=poblacion.idreg)': 'locality' ,
   *   },
   *   destinoIdUbicacion: {
   *     'ubicacion->destinoUbicacion(destinoIdUbicacion)': '-direccion_original',
   *     'poblacion(destinoUbicacion.idPoblacion=poblacion.idreg)': 'locality',
   *   },
   * }
   * ```
   */
  foreign?: { [key: string]: { [key: string]: string | RowHookFunction } };

  /** El servicio actualiza las filas de la EntityQuery registrada por el componente de lista asociada con la misma entidad. Por defecto está activado (true). */
  updateCacheRow?: boolean;

  /** Lista de entidades hijas a las que propagar los cambios tras guardar la fila padre en saveRow(). */
  propagateChanges?: string | EntitySchema | (string | EntitySchema)[];

  /** Lista de entidades cuyas filas hijas se borrarán tras eliminar la fila padre en deleteRow(). Si no se establece se utiliza el valor de propagateChanges */
  propagateDeletes?: string | EntitySchema | (string | EntitySchema)[];

  /** Declaración del formulario de la ficha */
  frm?: FormGroup;

  /**
   * Indica si la fila se agrupa y desagrupa al cargarla (getRow) y al guardarla (saveRow), respectivamente, en un formulario con grupos anidados.
   *
   * Por ejemplo, si tenemos un formualrio con un grupo anidado para las contraseñas.
   * ```typescript
   * frm: new FormGroup({
   *   idreg: new FormControl(),
   *   passwords: new FormGroup({
   *     password: new FormControl('', [Validators.minLength(6)]),
   *     confirm: new FormControl('', [Validators.minLength(6)]),
   *   }, MatchValidator)
   * })
   * ```
   *
   * La fila se aplana (desagrupa) y se envía a la base de datos como:
   * ```json
   * {
   *   idreg: 1,
   *   password: "123456",
   *   confirm: "123456"
   * }
   * ```
   *
   * Si no se aplana, entonces se envía manteniendo el anidamiento del formulario:
   * ```json
   * {
   *   idreg: 1,
   *   passwords: {
   *     password: "123456",
   *     confirm: "123456"
   *   }
   * }
   * ```
   */
  flatRow?: boolean;

  /**
   * Función de sobrescritura del procedimiento `getRow()`. Cuando se implementa dejan de llamarse a las funciones _built-in_ encargadas
   * de obtener la fila del backend y establecer el valor en el formulario.
   *
   * Veamos un ejemplo de formulario de detalle que se implementa para recoger el pin introducido por el usuario cuyo id
   * nos llega a través de un parámetro de la ruta.
   * ```typescript
   * get: (host: any) => host.frm.reset({ idreg: host.route.snapshot.params.id }),
   * ```
   */
  get?: (host: any) => void;

  /**
   * Función de sobrescritura del procedimiento `saveRow()`. Cuando se implementa dejan de llamarse a las funciones encargadas de parsear
   * y enviar el valor del formulario hacia el backend.
   *
   * En el siguiente ejemplo se implementa `save` para delegar en otra función de un servicio la tarea de enviar los cambios al backend.
   * ```typescript
   * save: (host: any) => host.auth.validate(host.model.backend.plural, host.frm, { navigateToLogin: true }),
   * ```
   */
  save?: (host: any) => void;

  /**
   * Función RowHook que se invoca para inicializar la fila cuando es nueva.
   *
   * ```typescript
   * // Inicializamos la nueva fila.
   * adding: (row: any, host: any) => { row.idUser = host.user.idreg; return row; }
   * ```
   * ```typescript
   * // Alternativa para inicializar múltiples campos de una sola vez.
   * adding: (row: any, host: any) => Object.assign(row, { idUser: host.user.idreg, favorito: 1 })
   * ```
   * ```typescript
   * // Alternativa asíncrona.
   * adding: (row: any, host: any) => host.user.get().pipe(mergeMap(user => of({ idreg: 'new', idUser: user.idreg })))
   * ```
   * ```typescript
   * // Alternativa asíncrona.
   * adding: (row: any, host: any) => new Observable<any>( observer => host.user.get().subscribe(user => observer.next({ idreg: 'new', idUser: user.idreg })) )
   * ```
   */
  adding?: RowHookFunction;

  /**
   * Función RowHook para editar una fila obtenida del backend.
   *
   * **Usage**
   * ```typescript
   * // Modificamos la fila.
   * opening: (row: any, host: any) => { row.idUser = host.user.idreg; return row; }
   * // Alternativa para inicializar múltiples campos de una sola vez.
   * opening: (row: any, host: any) => Object.assign(row, { idUser: host.user.idreg, favorito: 1 })
   * ```
   */
  opening?: RowHookFunction;

  /**
   * Función RowHook para mapear la fila obtenida del backend o creada nueva. Ocurre después de `adding` o `opening`.
   *
   * **Usage**
   * ```typescript
   * // Modificamos la fila.
   * mapping: (row: any, host: any) => { row.idUser = host.user.idreg; return row; }
   * // Alternativa para inicializar múltiples campos de una sola vez.
   * mapping: (row: any, host: any) => Object.assign(row, { idUser: host.user.idreg, favorito: 1 })
   * ```
   */
  mapping?: RowHookFunction;

  /**
   * Función RowHook que se ejecuta antes de enviar la fila a la base de datos.
   *
   * **Usage**
   * ```typescript
   * // Deshacemos los grupos FormGroup, por ejemplo para el grupo de passwords: password + confirm.
   * saving: (row: any, host: any) => api.unGroupData(row)
   * ```
   */
  saving?: RowHookFunction;

  // deleting?: RowHookFunction;

  /** Indica la ruta del componente relativa a `src` para realizar una importación dinámica. */
  componentUrl?: string;
}


/**
 * Define el modelo para un componente de lista.
 * @category Entity
 */
export interface EntityListSchema {

  /** Prefijo para enrutar las cadenas de traducción.
   * @Default _friendly.plural_
   * @category Customized message
   */
  translatePrefix?: string;

  /**
   * Texto para el ion-title del header cuando el componente de lista se muestra como modal.
   * - [x] El texto se traduce automáticamente.
   *
   * La fórmula para generar el texto automatizado es:
   * ```typescript
   * list.headerText = translatePrefix + '.' + 'list_' + friendly.plural | translate
   * ```
   *
   * **Usage**
   * ```typescript
   * {{list.headerText}}
   * ```
   *
   * Que es un código más portable que su equivalente:
   * ```typescript
   * {{'clientes.list_clientes' | translate}}
   * ```
   *
   * @category Customized message
   */
  headerText?: string;

  /**
   * Indicates whether the loader should be displayed during backend calls.
   * If this value is set, the general value of the scheme will be omitted.
   * @Default `true`
   */
  showLoader?: boolean;

  /**
   * Texto para el ion-button del footer que permite crear una nueva entidad.
   * - [x] El texto se traduce automáticamente.
   *
   * La fórmula para generar el texto automatizado es:
   * ```typescript
   * list.addNewText = translatePrefix + '.' + 'Add new ' + friendly.singular | translate
   * ```
   *
   * **Usage**
   * ```typescript
   * {{list.addNewText}}
   * ```
   * Que es un código más portable que su equivalente:
   * ```typescript
   * {{'clientes.Add new cliente' | translate}}
   * ```
   * @category Customized message
   */
  addNewText?: string;

  /**
   * Texto para el loader.
   * - [x] El texto se traduce automáticamente.
   *
   * La fórmula para generar el texto automatizado es:
   * ```typescript
   * list.loadingText = translatePrefix + '.' + 'Loading ' + friendly.plural | translate
   * ```
   *
   * **Usage**
   * ```typescript
   * {{list.loadingText}}
   * ```
   *
   * Que es un código más portable que su equivalente:
   * ```typescript
   * {{'clientes.Loading clientes' | translate}
   * ```
   * @category Customized message
   */
  loadingText?: string;

  /** Indica si la fila se tomará de la caché o del backend.
   * @Default `false`
   * @category Cache
   */
  cache?: boolean;

  /** Indica si la consulta se vaciará, `query.clear()`, cuando el componente se destruya, `ngOnDestroy`.
   * @Default `true`
   * @category Cache
   */
  clearQueryOnDestroy?: boolean;

  /** Indica si los resultados se obtendrán paginados o todos de una vez.
   * @Default `true`
   * @category Cache
   */
  paginate?: boolean;

  /** Indica el número de filas que se solicitarán en cada consulta cuando `paginate = true`.
   * @Default `100`
   * @category Cache
   */
  itemsPerPage?: number;

  /**
   * Lista de campos para la url de la consulta al backend.<br />
   * Si no se establece, entonces se recuperan todos los campos de la entidad principal.
   *
   * ```typescript
   * fields?: string | { [key: string]: string; } | (string | { [key: string]: string; })[]
   * ```
   *
   * - Las entidades foráneas se pueden definir a través del campo `fields`, como por ejemplo `usuasios?fields=nombre,apellidos,empresa(nombre)`,
   *   o también a través de la propiedad `foreign`. No hace falta repetirlas en ambas propiedades del modelo y siempre es preferible usar la propiedad `fields`.
   * - Usaremos la propiedad `foreign` en lugar de `fields` cuando queramos informar de la relación entre las entidades para así poder propagar
   *   los cambios en un servicio `AbstractModelService` que aloje ambos esquemas del modelo.
   *
   * **Usage**
   * ```typescript
   * // Los campos se expresan separados por comas:
   * fields: 'nombre,apellidos,nif'
   * // También se pueden expresar mediante un array:
   * fields: ['nombre','apellidos','nif']
   * // Si queremos recuperar campos de entidades padre (en notación API Rest):
   * fields: 'tarifa(descripcion,importe),empresa(nombre)'
   * // O bién en notación DataPath:
   * fields:'tarifa.descripcion,tarifa.importe,empresa.nombre'
   * // También se pueden expresar como un objeto:
   * fields: {
   *   'poblacion->origen(idorigen)': 'nombre',
   *   'poblacion->destino(iddestino)': 'nombre',
   * }
   * ```
   * @category Query
   */
  fields?: ApiFieldsType;

  /**
   * Información adicional foránea de la fila actual.
   *
   * ```typescript
   * foreign?: { [key: string]: { [key: string]: string | ((row: any) => any) | ((row: any) => Observable<any>) } }
   * ```
   *
   * - Las entidades foráneas se pueden definir a través del campo `fields`, como por ejemplo `usuasios?fields=nombre,apellidos,empresa(nombre)`,
   *   o también a través de la propiedad `foreign`. No hace falta repetirlas en ambas propiedades del modelo y siempre es preferible usar la propiedad `fields`.
   * - Usaremos la propiedad `foreign` en lugar de `fields` cuando queramos informar de la relación entre las entidades para así poder propagar
   *   los cambios en un servicio `AbstractModelService` que aloje ambos esquemas del modelo.
   *
   * ```typescript
   * // Indicamos el nombre de la propiedad de la que tomar el valor foráneo.
   * foreign: { idempresa: { empresa: 'nombre' } }
   * // Si indicamos varias propiedades obtendremos un objeto como valor foráneo.
   * foreign: { idUser: { usuario: 'nombre,apellidos' } }
   * ```
   *
   * ```typescript
   * // La linea del ejemplo anterior también se puede expresar usando una función `RowHookFunction`.
   * foreign: { idUser: { usuario: row => { nombre: row.nombre, apellidos: row.apellidos } }
   * // Devolvemos un valor primitivo resultado de concatenar el valor de varias propieades.
   * foreign: { idUser: { usuario: row => row.nombre + ' ' + row.apellidos }
   * // Devolvemos la fila foránea entera.
   * foreign: { idUser: { users: row => row }
   * ```
   *
   * ```typescript
   * // Usamos alias para la entidad cuando varias claves foráneas apuntan a la misma entidad padre.
   * foreign: {
   *   recogidaIdUbicacion: {
   *     'ubicacion->recogidaUbicacion(recogidaIdUbicacion)': '-direccion_original',
   *     'poblacion(recogidaUbicacion.idPoblacion=poblacion.idreg)': 'locality' ,
   *   },
   *   destinoIdUbicacion: {
   *     'ubicacion->destinoUbicacion(destinoIdUbicacion)': '-direccion_original',
   *     'poblacion(destinoUbicacion.idPoblacion=poblacion.idreg)': 'locality',
   *   },
   * }
   * ```
   * @category Query
   */
  foreign?: { [key: string]: { [key: string]: string | RowHookFunction } };

  /**
   * Define un filtro compatible con la clase _FilterPipe_.
   *
   * ```typescript
   * filter?: string | string[] | FilterTypeComplex
   * ```
   *
   * **Usage**
   *
   * ```html
   * <ion-item button *ngFor="let row of rows | filter:match:list.filter">
   * ```
   *
   * ```typescript
   * // Filtrar por una columna de la fila con valores primitivos.
   * filter: 'numero'
   * // Múltiples columnas.
   * filter: 'numero, emision'
   * // Múltiples columnas.
   * filter: ['numero', 'emision']
   * // Campos foráneos en notación API Rest.
   * filter: 'cliente(nombre, nif)'
   * // Campos foráneos en notación DataPath.
   * filter: 'cliente.nombre'
   * // No generar errores cuando faltan propiedades.
   * filter: 'cliente?.nombre'
   * ```
   * <br />
   * Ver la interface _FilterTypeComplex_ para establecer filtros complejos aplicables también sobre las consultas de backend.
   * @category Query
   */
  filter?: FilterType;

  /**
   * Define las cláusulas de ordenación en la url de la consulta al backend y también
   * la parametrización compatible con la clase _OrderByPipe_ para ordenar las filas en el front-end.
   *
   * ```typescript
   * orderBy?: ApiFieldsType | { pipe: ApiFieldsType, callback?: (host: any) => any, host?: any }
   * ```
   *
   * **Usage**
   *
   * ```html
   * <ion-list *ngFor="let row of rows | orderBy:list.orderBy">
   * ```
   *
   * Posibles valores:
   *
   * ```typescript
   * // Ordenar por una columna de la fila con valores primitivos.
   * orderBy: 'nombre'
   * // Ordenar por múltiples columnas.
   * orderBy: ['nombre', 'apellidos']
   * // Campos foráneos en notación API Rest.
   * orderBy: 'tarifas(descripcion)'
   * // Campos foráneos en notación DataPath.
   * orderBy: 'tarifas.descripcion'
   * ```
   *
   * También puede definirse una función para ejecutar como callback tras finalizar la tarea de transformación del pipe.
   *
   * La propiedad `host` se establece automáticamente desde el componente _AbstractListComponent_ y se utiliza para
   * pasar una referencia durante la llamada a la función de `callback`.
   * ```typescript
   * orderBy: {
   *   pipe: 'nombre-',
   *   callback: (host: any) => host.onSortItems(),
   * }
   * ```
   * @category Query
   */
  orderBy?: OrderByDirectionType | ApiFieldsType | OrderByTypeComplex;

  /**
   * Define un campo para la agrupación de las filas a través del pipe GroupByPipe.
   *
   * **Usage**
   *
   * ```html
   * <ng-container *ngFor="let group of rows | groupBy:list.groupBy">
   *   <ion-item-divider>{{group.key}}</ion-item-divider>
   *   <ion-list *ngFor="let row of group.rows">
   * ```
   *
   * Posibles valores:
   *
   * ```typescript
   * // Agrupar por una columna de la fila con valores primitivos.
   * groupBy: 'fecha'
   * // Campos foráneos en notación DataPath.
   * groupBy: 'parent.fecha'
   * // Usar una función para la obtención del valor de grupo de la fila.
   * groupBy: (row: any, host: any) => moment(row.fecha).format('YYYY-MM-DD')
   * ```
   * @category Query
   */
  groupBy?: GroupByType;

  /**
   * Parámetros para la url de la consulta al backend.
   *
   * ```typescript
   * params?: string | string[] | ((host: any) => string) | ((host: any) => Observable<string>)
   * ```
   *
   * Ejemplos:
   *
   * ```typescript
   * // Declaramos un parámetro para la url.
   * params: 'activate=false'
   * // Usamos una función para obtener una lista de parámetros para la url.
   * params: (host: any) => `activate=false&id=${host.route.snapshot.params.id}`
   * // Siguiendo el ejemplo, la función devolvería algo así como:
   * 'activate=false&id=123'
   * ```
   * @category Query
   */
  params?: string | string[] | ((host: any) => string) | ((host: any) => Observable<string>);

  /**
   * Activa y establece las condiciones de una consulta API Rest de tipo `GET->POST /search`.
   *
   * ```typescript
   * search?: ApiSearchClauses | ((host: any) => ApiSearchClauses) | ((host: any) => Observable<ApiSearchClauses>);
   * ```
   *
   * Todas las consultas, sean paginadas o no, son por defecto de tipo `GET`. Cuando se establece
   * _search_ la clase añade automáticamente el segmento `/search?` al final de la url
   * (antes de los parámetros) y la consulta pasa a ser técnicamente de tipo `POST`,
   * lo que permite enviar una mochila de datos con las condiciones de búsqueda.
   *
   * ```typescript
   * // Recupera los 100 primeros clientes.
   * this.api.get('/clientes?sort=nombre&limit=100');
   * // Recupera los 100 primeros clientes que no están de baja.
   * this.api.post('search/clientes?sort=nombre&limit=100', ['deleted', 'is', null]);
   * // En el esquema se traduce como:
   * search: ['deleted', 'is', null]
   * ```
   *
   * Ejemplo con múltiples cláusulas:
   * ```typescript
   * search: { AND: [
   *   ['idtaxista', 'NOT', null],
   *   ['tipo', '=', SERVICIO_SOLICITUD],
   *   ['recogida', '>', moment().format('YYYY-MM-DD HH:mmZ')],
   *   ['recogida', '<', moment().add(5, 'days').format('YYYY-MM-DD HH:mmZ')]
   * ]}
   * ```
   *
   * Ejemplo de función:
   * ```typescript
   * search: (host: any) => ['idUser', '=', host.user.idreg]
   * ```
   * <br />
   *
   * #### Filtro para backend
   *
   * Cuando se define un filtro para _backend_ a través de la propiedad `filter` del modelo,
   * la función {@link FilterTypeComplex.onDismiss onDismiss}
   * suministrada por defecto establece una función en `search` para poder transferir el filtro a la consulta.
   * La función {@link AbstractListComponent.parseAdvancedSearch parseAdvancedSearch}()
   * puede ser sobrescrita en la clase heredada para implementar conversiones de filtros complejos.
   *
   * ```typescript
   * search: (host: any): ApiSearchClauses => host.parseAdvancedSearch()
   * ```
   * @category Query
   */
  // search?: string | object | ((host: any) => any) | ((host: any) => Observable<any>);
  search?: ApiSearchClauses | ((host: any) => ApiSearchClauses) | ((host: any) => Observable<ApiSearchClauses>);

  /**
   * Indica si en lugar de usar AND como operador por defecto se utilizará OR para encadenar las
   * cláusulas entre diferentes entidades.
   * @category Query
   */
  searchOR?: boolean;

  /**
   * @ignore
   * Lista de dependencias que se inyectarán en el componente durante el constructor de su clase base.
   *
   * #### Remarks
   * Algunas de las clases abstractas cargan propiedades de tipo función del modelo durante el constructor.
   * Si pretendemos hacer uso de servicios no suministrados por la clase base, de nada nos servirá inyectarlos desde la clase heredada
   * ya que su constructor, desde donde se inyectan los servicios, se ejecuta más tarde que el constructor de la clase base,
   * por lo que los servicios no estarán disponibles durante el acceso a las propiedades de tipo función.
   *
   * **Usage**
   *
   * Un ejemplo típico es intentar obtener el id de la fila a través de una función que requiere de acceso a un servicio.
   * Por ejemplo, acceder al id del usuario que se obtiene del sotrage a través del servicio AuthService.
   *
   * ```typescript
   * list: {
   *   search: (host: any): ApiSearchClauses => ['idtaxista', '=', host.user.idreg],
   *   dependencies: { auth: AuthService }
   * }
   * ```
   */
  dependencies?: any;

  /**
   * Función RowHook para editar las filas obtenidas del backend.
   *
   * **Usage**
   * ```typescript
   * opening: (rows: any[], host: any) => { ...; return rows; }
   * ```
   */
  opening?: RowHookFunction;

  /**
   * Función _RowHook_ para mapear las filas devueltas por `getRows()`
   *
   * Por ejemplo, podemos usar la función para desagrupar resultados:
   * ```typescript
   * map: (row: any, host: any) => host.api.unGroupData(row)
   * ```
   * @category RowHook
   */
  map?: RowHookFunction;

  /**
   * Función RowHook que se ejecuta antes de enviar la fila a la base de datos.
   *
   * **Usage**
   * ```typescript
   * // Deshacemos los grupos FormGroup, por ejemplo para el grupo de passwords: password + confirm.
   * saving: (row: any, host: any) => api.unGroupData(row)
   * ```
   */
  saving?: RowHookFunction;

  /**
   * Indica los modos posibles de selección múltiple de los items de una lista.
   *
   * ```typescript
   * multiSelectModes: [
   *   {
   *     name: 'facturar', multi: true, icon: 'newspaper', color: 'primary',
   *     checked: 'checkmark-circle', unchecked: 'radio-button-off',
   *     checkable: ((row: any, host: any) => host.canFacturar(row)),
   *   }
   * ]
   * ```
   *
   * Si se van a usar modos de multiselección es necesario incluir en el modelo una función para el preFiltro:
   * ```typescript
   * {
   *   preFilter: (row: any, host: any): boolean => !host.multiSelect || host.multiSelect.checkable(row, host),
   * }
   * ```
   *
   * Se implementa en la clase {@link AbstractListComponent} y
   * el servicio {@link AbstractModelService.multiSelectModeChanged AbstractModelService}.
   *
   * @category MultiSelect
   */
  multiSelectModes?: MultiSelectType[];

  /** Suscribe el componente a las notificaciones de fila (created, modified, deleted) para actualizar automáticamente la caché, es decir, las filas de la EntityQuery registrada por el componente. Por defecto está activado (true). */
  notifyCacheRow?: boolean;

  /** Indica la ruta del componente relativa a `src` para realizar una importación dinámica. */
  componentUrl?: string;

  /**
   * Si la propiedad `allow` se establece en `true`, entonces el componente abstracto
   * monitoriza el scroll para aplicar estilos al header cuando se desplace hacia abajo
   * y mostrar un ion-fab-button para poder hacer scroll hacia arriba.
   * @see {@link AbstractListComponent.scrollingInitialize}
   */
  scrollToTop?: {
    /**
     * Habilita la monitorización del scroll. Si se establece en `false` se ignoranrán el resto de propiedades de `scrollToTop`.
     * @Default `true`
     * @see {@link AbstractListComponent.scrollingInitialize}
     */
    allow?: boolean;
    /**
     * Indica si el componente abstracto añade un ion-fab-button al contenido para poder hacer scroll hacia arriba.
     *
     * El componente se encarga automáticamente de mostrarlo u ocultarlo en función de la posición del scroll.
     * @Default `true`
     * @see {@link AbstractListComponent.scrollingInitialize}
     */
    allowFabButton?: boolean;
    /**
     * Indica la clase css que se aplicará al `ion-header` cuando la propiedad `canScrollToTop` sea `true`.
     * @Default `shadow`
     */
    headerCssClass?: string;
  };

}



