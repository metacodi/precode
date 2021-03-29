import { IonInfiniteScroll } from '@ionic/angular';

import { AppConfig } from 'src/core/app-config';
import { ApiSearchClauses } from 'src/core/api';

import { EntityCache } from './entity-cache';
import { EntityName, EntityModel } from './entity-model';
import { EntityListSchema, EntitySchema } from './entity-schema';


export interface EntityQueryType {
  main: string;
  related?: string;
  id?: string;
  fields?: string;
  sort?: string;
  params?: string;
  search?: ApiSearchClauses;
}

/** Define y administra las consultas realizadas para una entidad del modelo de datos. */
export class EntityQuery {
  protected debug = true && AppConfig.debugEnabled;

  /** Clave que identifica a esta consulta de forma inequívoca. */
  key: string;
  /** Nombre de la entidad principal de la consulta. */
  get name(): EntityName { return this.model.name; }
  /** Modelo en el que se basa la consulta. */
  model: EntityModel;
  /** Caché de resultados. Acumula las filas en las sucesivas llamadas paginadas. */
  rows: any[] = [];
  /** Número de páginas cargadas. */
  page = 0;
  /** Indica cuando se han cargado todas las páginas de la consulta actual. */
  completed = false;
  /** Referencia al componente ion-infinite-scroll */
  infinite: IonInfiniteScroll;
  /** Referencia a la caché de consultas. NOTA: La instancia debe proveerse desde fuera de la clase. */
  cache: EntityCache;

  constructor(model: EntitySchema | EntityModel, key?: string) {
    // Obtenemos una instancia del modelo.
    if (!(model instanceof EntityModel)) { model = new EntityModel(model); }
    // Referenciamos la entidad que modelará las consultas.
    this.model = model as EntityModel;
    // Si no se ha indicado una clave, usamos el nombre de la entidad por defecto.
    this.key = key || this.model.name.plural;
  }

  /**
   * @description Obtiene una url completa para usar contra un servicio http.
   *
   * ```typescript
   * // Formulas
   * entity?id=:id&rel=:related&fields=:fields&sort=:fields&offset=:n&limit=:n
   * entity/related?fields=fields&sort=fields&offset=n&limit=n
   *
   * // Examples
   * tarifas?sort=descripcion
   * precios_tarifa?rel=tarifa&fields=tarifa(descripcion->tarifa)&sort=origen,destino
   * festivos?rel=tarifa&fields=tarifa(descripcion->tarifa)&sort=mes,dia
   * ```
   */
  async resolveUrl(options?: { host?: any, entityName?: string, id?: number | 'new', paginate?: boolean, itemsPerPage?: number, customFields?: string, search?: EntityListSchema['search'] }): Promise<string> {
    if (!options) { options = {}; }
    // Obtenemos la url base para añadirle los parámetros de paginación.
    return this.model.resolveUrl(options).then(url => {
      // Solo consultas para listados.
      if (!options.id) {
        // Obtenemos la info del modelo.
        const list: EntityListSchema = this.model.list;
        const paginate = options.paginate !== undefined ? options.paginate : list.paginate;
        // Comprobamos si hay que paginar.
        if (paginate) {
          // Paginamos los resultados.
          const limit = options.itemsPerPage || list.itemsPerPage || 100;
          const currentPage = this.completed ? 0 : +this.page;
          // const offset = Math.max(currentPage * limit, this.rows.length);
          const offset = currentPage * limit;
          url += url.endsWith('?') ? '' : url.includes('?') ? '&' : '?';
          url += `limit=${limit}&offset=${offset}`;
        }
        if (this.debug) { console.log(this.constructor.name + '.resolveUrl()', { page: this.page, completed: this.completed }); }
      }
      return url;
    });
  }

  // /** Resuelve la consulta solicitada. */
  // async resolveQuery(options?: { host?: any, entityName?: string, id?: number | 'new', paginate?: boolean, customFields?: string }): Promise<any> {
  //   this.cache.resolveQuery();
  // }

  /** Limpia la caché de resultados. Inicializa la paginación. */
  clear(): void {
    // Limpiamos la caché e inicializamos la paginación.
    this.rows = []; this.page = 0; this.completed = false;
    // Reactivamos el componente ion-infinite-scroll.
    if (this.infinite) { this.infinite.disabled = false; }
    if (this.debug) { console.log(this.constructor.name + '.restart()', { page: this.page, completed: this.completed }); }
  }
}
