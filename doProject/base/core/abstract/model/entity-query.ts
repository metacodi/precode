import { AppConfig } from 'src/core/app-config';

import { EntityListSchema, EntitySchema } from './entity-schema';
import { EntityName, EntityModel } from './entity-model';


/** Define y administra las consultas realizadas para una entidad del modelo de datos. */
export class EntityQuery {
  protected debug = true && AppConfig.debugEnabled;

  /** Clave que identifica a esta consulta de forma inequívoca. */
  key: string;
  /** Nombre de la entidad principal de la consulta. */
  get name(): EntityName { return this.model.name; }
  // /** Nombre de la entidad principal de la consulta. */
  // get name(): EntityName { return EntityName.resolve(this.schema.name); }
  /** Modelo en el que se basa la consulta. */
  model: EntityModel;
  // /** Esquema en el que se basa la consulta. */
  // schema: EntitySchema;
  /** Caché de resultados. Acumula las filas en las sucesivas llamadas paginadas. */
  rows: any[] = [];
  /** Número de páginas cargadas. */
  page = 0;
  /** Indica cuando se han cargado todas las páginas de la consulta actual. */
  paginationComplete = false;
  /** Referencia al componente ion-infinite-scroll */
  infinite: any;

  constructor(model: EntitySchema | EntityModel, key?: string) {
    // Obtenemos una instancia del modelo.
    if (!(model instanceof EntityModel)) { model = new EntityModel(model); }
    // Referenciamos la entidad que modelará las consultas.
    this.model = model as EntityModel;
    // Si no se ha indicado una clave, usamos el nombre de la entidad por defecto.
    this.key = key || this.model.name.plural;
  }
  // constructor(model: EntitySchema | EntityModel, key?: string) {
  //   // Obtenemos una instancia del modelo.
  //   if (model instanceof EntityModel) { model = new EntityModel(model); }
  //   // Referenciamos la entidad que modelará las consultas.
  //   this.schema = model as EntityModel;
  //   // Si no se ha indicado una clave, usamos el nombre de la entidad por defecto.
  //   this.key = key || this.name.plural;
  // }

  /**
   * @description Obtiene una url completa para usar contra un servicio http.
   *
   * ```typescript
   * // Formulas
   * entity/related?fields=fields&sort=fields&offset=n&limit=n
   *
   * // Examples
   * tarifas?sort=descripcion
   * precios_tarifa/tarifa?fields=tarifa(descripcion->tarifa)&sort=origen,destino
   * festivos/tarifa?fields=tarifa(descripcion->tarifa)&sort=mes,dia
   * ```
   */
  async resolveUrl(options?: { host?: any, entityName?: string, id?: number | 'new', paginate?: boolean, customFields?: string }): Promise<string> {
    if (!options) { options = {}; }
    // Obtenemos la url base para añadirle los parámetros de paginación.
    return this.model.resolveUrl(options).then(url => {
      // Solo consultas para listados.
      if (!options.id) {
        // Obtenemos la info del modelo.
        const list: EntityListSchema = this.model.list;
        // Comprobamos si hay que paginar.
        if (options.paginate !== undefined ? options.paginate : list.paginate) {
          // Paginamos los resultados.
          const limit = list.itemsPerPage || 100;
          const currentPage = this.paginationComplete ? 0 : +this.page;
          // const offset = Math.max(currentPage * limit, this.rows.length);
          const offset = currentPage * limit;
          url += url.endsWith('?') ? '' : url.includes('?') ? '&' : '?';
          url += `limit=${limit}&offset=${offset}`;

        // } else if (options.paginate === undefined) { // Si se ha realizado una llamada forzando la paginación, ignoramos el estado de paginación del query.
        //   // Obtenemos todos los resultados en una sola llamada.
        //   this.rows = []; this.page = 0; this.paginationComplete = true;
        }
        if (this.debug) { console.log(this.constructor.name + '.resolveUrl()', { page: this.page, paginationComplete: this.paginationComplete }); }
      }
      return url;
    });
  }

  /** Limpia la caché de resultados. Inicializa la paginación. */
  clear(): void {
    // Limpiamos la caché e inicializamos la paginación.
    this.rows = []; this.page = 0; this.paginationComplete = false;
    // Reactivamos el componente ion-infinite-scroll.
    if (this.infinite) { this.infinite.disabled = false; }
    if (this.debug) { console.log(this.constructor.name + '.restart()', { page: this.page, paginationComplete: this.paginationComplete }); }
  }
}
