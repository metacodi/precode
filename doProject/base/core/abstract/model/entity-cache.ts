import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as moment from 'moment';

import { ApiSearchClauses, ApiService } from 'src/core/api';

import { EntityQuery, EntityQueryType } from './entity-query';
import { EntityModel, EntityName } from './entity-model';


/** Representa una consulta de la caché. */
export interface CacheQuery {
  /** Indica si la consulta es parcial o absoluta. */
  isPartial: boolean;
  /** Cláusulas where de la sub consulta. */
  search?: any;
  /** Cláusulas de ordenación de la consulta. */
  sort?: any;
  /** Encapsula una consulta manejada por los componentes y el servicio del modelo abstracto. */
  query: EntityQuery;
  /** Caché de resultados. Acumula las filas en las sucesivas llamadas paginadas. */
  rows: any[];
  /** Indica la hora de la última consulta de auditoría o de la consulta que completó la caché. */
  lastAuditTime: string;
}


/**
 * Maneja las diferentes variantes de consultas a una misma entidad.
 *
 * Las variantes de las consultas comparten entre todas ellas las mismas entidades relacionadas y campos solicitados.
 *
 * La caché diferencia en dos colecciones las variantes de las consultas:
 * - Consultas absolutas: aquellas consultas sin cláusula `where` que obtendrían todas las filas de la tabla si se consumieran todas las páginas posibles.
 * - Consultas parciales o subconsultas: aquellas consultas con cláusula `where` que obtendrían un sub conjunto de las filas de la entidad.
 */
export class EntityCache {
  /** Colección de consultas absolutas mantenidas por la caché. */
  queries: CacheQuery[] = [];
  /** Colección de consultas parciales o subconsultas mantenidas por la caché. */
  subqueries: CacheQuery[] = [];
  /** Indica si se han obtenido en caché todas las filas de la entidad. */
  completed = false;
  /** Indica si se excluyen las filas eliminadas de todas las consultas, tanto absolutas como parciales. */
  excludeDeleted = true;
  /** Indica el tamaño máximo de la caché calculado como la suma de las filas de todas las consultas actuales. */
  maxSize: number = undefined;
  /** Devuelve el tamaño actual de la caché. */
  get size(): number {
    let total = 0;
    this.queries.map(q => total += q.query.rows.length);
    this.subqueries.map(q => total += q.query.rows.length);
    return total;
  }
  /** Referencia al modelo que define la entidad. */
  get model(): EntityModel { return this.query.model; }
  /** Indica si las consultas comparadas son de la misma variante. */
  static equals(q1: CacheQuery, q2: CacheQuery): boolean {
    // TODO: comparar además los campos solicitados, las cláusulas where y la cláusulas de ordenación de las filas.
    return EntityName.equals(q1.query.name, q2.query.name);
  }
  /** Obtiene el tipo de consulta absoluta. */
  static async type(model: EntityModel, host?: any): Promise<EntityQueryType> {
    const entityName =  EntityName.resolve(model.backend).plural;
    const fields = model.schema.list.fields;
    const { foreign, params } = model.schema.list;
    return EntityModel.resolveQuery({ entityName, foreign, fields, params, host });
  }

  constructor(
    public query: EntityQuery,
    public api: ApiService,
    ) {
  }

  /** Resuelve la consulta solicitada. */
  async resolveQuery(options?: { host?: any, paginate?: boolean, customFields?: string }): Promise<any> {
    return new Promise<any>(async (resolve: any, reject: any) => {
      // Obtenemos la consulta por partes.
      this.model.resolveQuery(options).then(parts => {
        // Comprobamos si la caché está completada.
        if (this.completed) {
          // TODO: Obtenemos la consulta de caché correspondiente.
          // const query: CacheQuery =
          // Realizamos una consultoria de auditoría
          // this.requestAudit(query, options);

        } else {

        }
        resolve(undefined);
      }).catch(error => reject(error));
    });
  }

  /** Realizamos una consulta de auditoria. */
  requestAudit(query: CacheQuery, options?: { host?: any, paginate?: boolean, customFields?: string }): Observable<any> {
    // const entityName = EntityName.resolve(this.model.backend).plural;
    // const fields = this.model.list.fields;
    const { foreign } = this.model.list;
    // return from(EntityModel.resolveQuery({ host: options.host, entityName, foreign, fields, params })).pipe(switchMap(parts => {
    return from(this.model.resolveQuery({host: options.host})).pipe(switchMap(parts => {
      const { main, related, fields, params } = parts;
      // const fields = this.model.list.fields;
      // const { foreign, params } = this.model.list;
      return from(EntityModel.resolveUrl({ host: options.host, entityName: main, foreign, fields, params })).pipe(switchMap(url => {
        const search = this.resolveAuditSearch();
        return this.api.post(url, search);
      }));
    }));
  }

  /** Devuelve las cláusulas search para una consulta de auditoría.
   *
   * ```typescript
   * const search = resolveAuditSearch('2020-12-19', 'facturas');
   * ```
   *
   * Siguiendo el ejemplo, el valor de search sería:
   *
   * ```typescript
   * { OR: [
   *   ['facturas.updated', '>', '2020-12-19'],
   *   ['facturas.deleted', '>', '2020-12-19'],
   * ]}
   * ```
   */
  resolveAuditSearch(lastAuditTime?: string, entityName?: string): ApiSearchClauses {
    lastAuditTime = lastAuditTime || moment().format('YYYY-MM-DD HH:mm:ss');
    const audit = this.model.schema.auditFields;
    const updated = audit.updated ? entityName + '.' + audit.updated : '';
    const deleted = audit.deleted ? entityName + '.' + audit.deleted : '';
    if (!audit) { return null; }
    if (updated && !deleted) { return [updated, '>', lastAuditTime]; }
    if (!updated && deleted) { return [deleted, '>', lastAuditTime]; }
    return { OR: [
      [updated, '>', lastAuditTime],
      [deleted, '>', lastAuditTime],
    ]};
  }

  /** Busca una consulta en la lista de la caché. */
  findQuery(query: CacheQuery): CacheQuery {
    if (!query) { return undefined; }
    if (query.isPartial) {
      const found = this.subqueries.find(q => EntityCache.equals(q, query));
      if (found) { return found; }
    }
  }

}
