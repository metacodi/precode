import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject, BehaviorSubject } from 'rxjs';


// ---------------------------------------------------------------------------------------------------
//  Api Error codes
// ---------------------------------------------------------------------------------------------------

export const HTTP_ERR_BAD_REQUEST = 400;
export const API_ERR_INVALID_RESOURCE = 460;
export const API_ERR_INVALID_ENTITY_ORDER = 461;
export const API_ERR_INVALID_ENTITY = 462;
export const API_ERR_INVALID_PRIMARY_KEY = 463;
export const API_ERR_INVALID_RELATION = 464;
export const API_ERR_INVALID_EXPLICIT_RELATION = 472;
export const API_ERR_INVALID_ENTITY_FIELD = 465;
export const API_ERR_INVALID_ENTITY_FIELDS = 467;
export const API_ERR_INVALID_REQUEST_DATA = 468;
export const API_ERR_INVALID_ID = 469;
export const API_ERR_FORBIDDEN_FIELD_ON_METHOD = 470;
export const API_ERR_DELETING_ROW = 471;
export const API_ERR_VALUE_REQUIRED = 474;
export const API_ERR_INVALID_OPERATOR = 475;
export const API_ERR_INVALID_ACTION = 476;
export const API_ERR_INVALID_SESSION_FIELD = 477;

export const HTTP_ERR_UNAUTHORIZED = 401;
export const API_ERR_VALIDATION_REQUIRED = 401;
export const API_ERR_USERNAME_REQUIRED = 486;
export const API_ERR_PASSWORD_REQUIRED = 487;
export const API_ERR_EMAIL_REQUIRED = 488;
export const API_ERR_INVALID_CREDENTIALS = 489;
export const API_ERR_SESSION_EXPIRED = 490;
export const API_ERR_INVALID_EMAIL = 492;
export const API_ERR_VALIDATION_PENDENT = 493;
export const API_ERR_RESTORE_PASSWORD = 494;
export const API_ERR_INVALID_PIN = 495;
export const API_ERR_INVALID_TOKEN = 498;

export const HTTP_ERR_FORBIDDEN = 403;
export const API_ERR_FORBIDDEN_SERVICE = 480;
export const API_ERR_FORBIDDEN_REQUEST_ENTITY = 481;
export const API_ERR_FORBIDDEN_CREATE_ROWS = 482;
export const API_ERR_FORBIDDEN_UPDATE_ROWS = 483;
export const API_ERR_FORBIDDEN_DELETE_ROWS = 484;
export const API_ERR_FORBIDDEN_SET_FIELD = 485;

export const API_ERR_INVALID_ROW = 404;
export const API_ERR_INVALID_METHOD = 405;

export const API_ERR_INTERNAL_SERVER_ERROR = 500;


// ---------------------------------------------------------------------------------------------------
//  Api interfaces & types
// ---------------------------------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';  // |'HEAD' | 'JSONP' | 'OPTIONS';
export type HttpObserve = 'body' | 'response' | 'events';
export type HttpResponseType = 'arraybuffer' | 'blob' | 'json' | 'text';

export type ApiSearchOpClause = '=' | '<' | '>' | '<=' | '>=' | '<>' | 'is' | 'is not' | 'in' | 'not in' | 'like' | 'not like';
// [field, '=', value]
export type ApiSearchClause = [string, ApiSearchOpClause, string | number | number[] | boolean | null];
export type ApiSearchOrClauses = { OR: (ApiSearchClause | ApiSearchOrClauses | ApiSearchAndClauses)[] };
export type ApiSearchAndClauses = { AND: (ApiSearchClause | ApiSearchOrClauses | ApiSearchAndClauses)[] };
export type ApiSearchClauses = ApiSearchAndClauses | ApiSearchOrClauses | ApiSearchClause;

export type ApiBodyType = null | number | string | object | ApiSearchClauses |(null | number | string | object | ApiSearchClauses)[];

export interface ApiRequest {
  method: string;
  url: string;
  options: ApiRequestOptions;
  subject: Subject<any> | BehaviorSubject<any>;
  loader?: any;
  // timestamp?: number,
}

/**
 * Extiende la clase HttpRequestOptions.
 */
export interface ApiRequestOptions {
  body?: any;
  headers?: HttpHeaders | { [header: string]: string | string[] };
  observe?: 'body' | 'response' | 'events';
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  withCredentials?: boolean;

  /** Indica si se mostrarán mensajes de error automáticamente. */
  showErrors?: boolean;
  /** Indica si se mostrará un loader durante la llamada al backend. */
  showLoader?: boolean;
  /** Texto que se mostrará en el spinner. */
  loaderText?: string;
  /** Indica si se usará la caché de consultas. @deprecated */
  useCache?: boolean;
  /** Referencia al subject que se utiliza para transmitir la respuesta al finalizar la consulta. */
  subject?: Subject<any> | BehaviorSubject<any>;
  /** Indica si se adjuntarán las versiones blob a la consulta para recibir las actualizaciones correspondientes en la respuesta. */
  blobs?: false | 'check' | 'force' | string | string[] | number | number[];
  /** Indica si se adjuntarán las versiones de ajustes de usuario a la consulta para recibir las actualizaciones correspondientes en la respuesta. */
  userSettings?: false | 'check' | 'force' | string | string[] | number | number[];
}

/** Indica el género de una entidad. Se requiere para la generación de respuestas automatizadas a partir de plantillas. */
export type Gender = 'Female' | 'Male';

/** Indica la forma de resolución de los nombres de entidad. 'Pessimistic' comprueba singular y plural, mientras que 'Optimistic' solo busca coincidencias respecto al plural. */
export type CompareNames = 'Optimistic' | 'Pessimistic';

/**
 * Expresa la notación compleja de campos foráneos para la ApiRest.
 *
 * ```typescript
 * // Cuando necesitamos indicar un alias para la tabla foránea e
 * // indicar al mismo tiempo la clave foránea pq existen dos
 * // referencias a la misma entidad desde claves foráneas distintas:
 * fields: {
 *   'poblacion->origen(idorigen)': 'nombre',
 *   'poblacion->destino(iddestino)': 'nombre',
 * }
 * ```
 */
export interface ApiForeignFieldsType { [key: string]: string; }

/**
 * Expresa la notación de campos para la ApiRest.
 *
 * ```typescript
 * interface ApiForeignFieldsType { [key: string]: string; }
 * ```
 *
 * ```typescript
 * // Los campos se expresan separados por comas:
 * fields: 'nombre, apellidos, nif'
 * // También se pueden expresar mediante un array:
 * fields: ['nombre', 'apellidos', 'nif']
 * // Si queremos recuperar campos de entidades padre (en notación API Rest):
 * fields: 'tarifa(descripcion, importe), empresa(nombre)'
 * // O bién en notación DataPath:
 * fields:'tarifa.descripcion, tarifa.importe, empresa.nombre'
 * // También se pueden expresar como un objeto cuando necesitamos definir propiedades foráneas con tablas mapeadas:
 * fields: {
 *   'poblacion->origen(idorigen)': 'nombre',
 *   'poblacion->destino(iddestino)': 'nombre',
 * }
 * ```
 */
export type ApiFieldsType = string | ApiForeignFieldsType | (string | ApiForeignFieldsType)[];

/** Operador de concatenación. */
export type ConcatOperatorType = 'OR' | 'AND';

/** Define una sentido para la ordenación de valores primitivos. */
export type OrderByDirectionType = 'asc' | 'desc' | '+' | '-' | 1 | -1;
/** Type guard for OrderByDirectionType type. */
export function isOrderByDirectionType(order: any): order is OrderByDirectionType {
  return order === 'asc' || order === 'desc' || order === '+' || order === '-' || order === 1 || order === -1;
}

/** Reduce el valor de la dirección a solo tres opciones numéricas `1 | 0 | -1`. */
export function normalizeDirection(direction?: OrderByDirectionType): 1 | 0 | -1 {
  // Valor por defecto.
  if (direction === undefined) { return 0; }
  // Normalizamos la dirección reduciéndola a una expresión numérica.
  return direction === 'asc' || direction === 1 || direction === '+' ? 1
    : (direction === 'desc' || direction === -1 || direction === '-' ? -1 : 0);
}

/** Obtiene el valor primitivo resolviendo el árbol de propiedades cuando éste es un objeto. */
export function resolveDirection(prop: any): 1 | -1 {
  // Ej: value = { precio: 5.5, tarifa: { descripcion: 'T-1' } }
  if (typeof prop === 'string') {
    // Ej: prop = 'precio'
    return prop.startsWith('-') || prop.endsWith('-') ? -1 : 1;

  } else if (typeof prop === 'object') {
    // Ej: prop = { tarifa: 'descripcion' }
    for (const p in prop) {
      // Ej: p = 'tarifa'
      if (prop.hasOwnProperty(p)) {
        // Ej: value[tarifa] = { descripcion: 'T-1' }, prop[tarifa] = 'descripcion'
        return resolveDirection(prop[p]);
      }
    }
    return 1;

  } else {
    throw new Error(`Invalid type '${typeof prop}' of property for obtain direction in OrderByPipe`);
  }
}

/**
 * Define una expresión de ordenación compleja.
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
 */
export interface OrderByTypeComplex { pipe: ApiFieldsType; callback?: (host: any) => any; host?: any; }

/**
 * Define una expresión de ordenación para un array.
 *
 * Usamos `OrderByDirectionType` para definir un sentido de la ordenación para un array de valores primitvos.
 * ```html
 * <ion-item *ngFor="let value of primitives | orderBy"><!-- by default: 'asc' -->
 * <ion-item *ngFor="let value of primitives | orderBy:'asc'">
 * <ion-item *ngFor="let value of primitives | orderBy:'+'">
 * <ion-item *ngFor="let value of primitives | orderBy:1">
 * <ion-item *ngFor="let value of primitives | orderBy:'desc'">
 * <ion-item *ngFor="let value of primitives | orderBy:'-'">
 * <ion-item *ngFor="let value of primitives | orderBy:-1">
 * ```
 *
 * <!-- Sorting an array of objects -->
 * ```html
 * <ion-item *ngFor="let value of objects | orderBy:'name'">
 * <ion-item *ngFor="let value of objects | orderBy:'name, age'">
 * <ion-item *ngFor="let value of objects | orderBy:'name, -age'">
 * <ion-item *ngFor="let value of objects | orderBy:'name, age desc'">
 * <ion-item *ngFor="let value of objects | orderBy:['name']">
 * <ion-item *ngFor="let value of objects | orderBy:['name', 'age']">
 * <ion-item *ngFor="let value of objects | orderBy:['name', '-age']">
 * <ion-item *ngFor="let value of objects | orderBy:'tarifa(descripcion)'">
 * ```
 */
export type OrderByType = OrderByDirectionType | ApiFieldsType | OrderByTypeComplex;


/** Elimina los operadores y devuelve únicamente el nombre del campo real (el alias si está definido) */
export function sanitizePropertyName(prop: string): string {
  if (prop.startsWith('-')) { prop = prop.substring(1); }
  if (prop.endsWith('-')) { prop = prop.slice(0, -1); }
  if (prop.endsWith('?')) { prop = prop.slice(0, -1); }
  if (prop.includes('->')) {
    // Ej: poblaciones->origen(nombre)
    const parts = prop.split('->');
    // console.log(`prop.includes('->') => `, { parts });
    // Nos quedamos únicamente con el alias de los campos.
    return parts[1];
  }
  return prop;
}

/**
 * Devuelve el índice de la fila en la colección. Se utiliza como _callback_ para la función `findIndex`.
 *
 * Para poder comparar las filas con `idreg === 'new'` se  espera que éstas tengan una propiedad `idregNew`.
 *
 * ```typescript
 * const index = rows.findIndex(findRowIndex(row));
 * ```
 */
export function findRowIndex(row: any): (cur: any, index: number, rows: any[]) => boolean {
  return (cur: any, index: number, rows: any[]): boolean => {
    if ( (cur.idreg === 'new' && !cur.hasOwnProperty('idregNew'))
      || (row.idreg === 'new' && !row.hasOwnProperty('idregNew'))
    ) {
      throw new Error('Se esperaba una propiedad `idregNew` en la fila para poder compararla con el resto de filas nuevas del array.');
    }
    const idregCur = cur.idreg === 'new' ? cur.idregNew : cur.idreg;
    const idregRow = row.idreg === 'new' ? row.idregNew : row.idreg;
    return idregRow === idregCur;
  };
}

/** Combina dos grupos de cláusulas con el operador indicado. */
export function combineClauses(clausesA: ApiSearchClauses, clausesB: ApiSearchClauses, concatOp?: ConcatOperatorType): ApiSearchClauses {
  if (!concatOp) { concatOp = 'AND'; }
  if (Array.isArray(clausesA) && !clausesA.length) { clausesA = null; }
  if (Array.isArray(clausesB) && !clausesB.length) { clausesB = null; }
  if (!clausesA || !clausesB) { return clausesA || clausesB; }
  // { OR: [clausesA, clausesB] } | { AND: [clausesA, clausesB] }
  const clauses = { [concatOp]: [] };
  // concatOp: 'OR' | 'AND'; clausesA: { OR: [...] } | { AND: [...] }
  if (!clausesA[concatOp]) { clauses[concatOp].push(clausesA); } else { clauses[concatOp].push(...clausesA[concatOp]); }
  if (!clausesB[concatOp]) { clauses[concatOp].push(clausesB); } else { clauses[concatOp].push(...clausesB[concatOp]); }
  return clauses as ApiSearchClauses;
}
