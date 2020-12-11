import { Injector } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { ApiEntity, ApiFieldsType, CompareNames, isOrderByDirectionType, OrderByDirectionType, OrderByTypeComplex } from 'src/core/api';

import { EntityType, EntitySchema, EntityDetailSchema, EntityListSchema, FilterTypeComplex, GroupByTypeComplex, RowHookFunction } from './entity-schema';



/** Expresa el nombre de una entidad */
export interface EntityName { singular: string; plural: string; }


// @dynamic
/**
 * Instancia del modelo que se obtiene de resolver un esquema `EntitySchema`.
 */
export class EntityModel {

  /** Referencia al Injector para suministrar servicios como por ejemplo los de traducción. */
  static injector: Injector = undefined;

  // ---------------------------------------------------------------------------------------------------
  //  properties : wrapping the schema.
  // ---------------------------------------------------------------------------------------------------
  private debug = false;

  /** Esquema que modela la entidad
   * @category Schema
   */
  schema: EntitySchema = undefined;

  /** Identificador de la entidad en singular y plural. @Default singular = plural triming last 's'
   * @category Schema
   */
  get name(): EntityName { return (this.schema.name as EntityName); }

  /** Nombre para referirse a la entidad de la api. @Default entity.name
   * @category Schema
   */
  get backend(): EntityName { return (this.schema.backend as EntityName); }

  /** Nombre amigable para referirse a las entidades de esta tipo. @Default entity.name
   * @category Schema
   */
  get friendly(): EntityName { return (this.schema.friendly as EntityName); }

  /** Indica el nombre del campo de la clave primaria de la entidad. @Default `idreg`
   * @category Schema
   */
  get primaryKey(): string { return this.schema.primaryKey; }

  /** Indica si se mostrará el loader durante las llamadas al backend. @Default true
   * @category Schema
   */
  get showLoader(): boolean { return this.schema.showLoader; }

  /** Indica si el componente de lista debe realizar una precarga de la fila de detalle antes de navegar hacia el componente de detalle.
   * @category Schema
   */
  get preload(): boolean { return this.schema.preload; }

  /** Información sobre la entidad singular
   * @category Schema
   */
  get detail(): EntityDetailSchema { return this.schema.detail; }

  /** Información sobre la entidad plural
   * @category Schema
   */
  get list(): EntityListSchema { return this.schema.list; }


  // ---------------------------------------------------------------------------------------------------
  //  static methods
  // ---------------------------------------------------------------------------------------------------

  /** Obtiene una instancia del servicio solicitado entre los argumentos suministrados.
   * @category Resolvers
   */
  static getInstanceOf(instanceType: any, ...args: any[]): any {
    // Iteramos el resto de argumentos suministrados.
    for (const arg of args) {
      // Comprobamos si es el tipo buscado.
      if (arg instanceof instanceType) { return arg; }
      // Retenemos el inyector por si falla la búsqueda.
      if (arg instanceof Injector) { EntityModel.injector = arg; }

      if (!!arg && typeof arg === 'object') {
        // NOTA: Cuando pasamos por referencia el inyector de otra clase puede que la instancia llegue como Injector_.
        // Comprobamos si es un posible candidato a Injector.
        if (typeof arg.get === 'function' && !arg.hasOwnProperty('get') && arg.hasOwnProperty('elDef') && arg.hasOwnProperty('view')) {
          // Intentamos crear una instancia.
          const candidateInjector: any = arg;
          const instance = candidateInjector.get(instanceType);
          // console.log('arg === object !!! => instance ', { instance, instanceType: instance instanceof instanceType ? true : false });
          if (instance instanceof instanceType) { return instance; }
        }
        // Si es un objeto, como un servicio o un compoonente, exploramos sus propiedades.
        for (const prop in arg) {
          if (arg.hasOwnProperty(prop)) {
            if (arg[prop] instanceof instanceType) { return arg[prop]; }
            if (arg[prop] instanceof Injector) { EntityModel.injector = arg; }
          }
        }
      }
    }
    // Si hemos conseguido el inyector intentamos obtener el servicio a través de él.
    if (EntityModel.injector) { return EntityModel.injector.get<any>(instanceType); }
    // No se ha podido encontrar el servicio entre los argumentos suministrados.
    return null;
  }


  // ---------------------------------------------------------------------------------------------------
  //  static resolvers
  // ---------------------------------------------------------------------------------------------------

  /** Devuelve el modelo completamente inicializado con los valores por defecto que faltavan por establecer.
   * @category Resolvers
   */
  static resolveSchema(schema: EntitySchema | string, ...args: any[]): EntitySchema {
    // console.log('EntityModel.resolveSchema(schema) => ', { schema, args });
    // Intentamos obtener el servicio de traducción.
    const translate: TranslateService = EntityModel.getInstanceOf(TranslateService, ...args);

    // Comprobamos los argumentos.
    if (typeof schema === 'string') { schema = { name: schema }; }

    // Resolvemos el identificador de la entidad.
    if (typeof schema.name === 'string') { schema.name = EntityName.resolve(schema.name); }

    // Resolvemos el nombre para la entidad del backend. Por defecto tomamos el nombre del identificador.
    if (schema.backend === undefined) { schema.backend = { singular: schema.name.singular.replace(/-/g, '_'), plural: schema.name.plural.replace(/-/g, '_') }; }
    if (typeof schema.backend === 'string') { schema.backend = EntityName.resolve(schema.backend); }

    // Resolvemos el nombre amigable de la entidad.
    if (typeof schema.friendly === 'string') { schema.friendly = EntityName.resolve(schema.friendly); }
    // Si no se ha establecido tomamos por defecto el nombre del identificador.
    // if (!schema.friendly) { schema.friendly = Object.assign({}, schema.name); }
    if (!schema.friendly) { schema.friendly = { singular: schema.name.singular.replace(/-/g, ' '), plural: schema.name.plural.replace(/-/g, ' ') }; }

    // Comprobamos si se ha establecido la clave primaria.
    if (!schema.primaryKey) { schema.primaryKey = 'idreg'; }

    // showLoader
    if (schema.showLoader === undefined) { schema.showLoader = false; }

    // preload
    if (schema.preload === undefined) { schema.preload = true; }


    //  detail
    // ---------------------------------------------------------------------------------------------------
    if (!schema.detail) { schema.detail = {}; }

    // Comprobamos si se ha establecido un prefijo para las cadenas de traducción.
    if (schema.detail.translatePrefix === undefined) { schema.detail.translatePrefix = schema.friendly.singular; }

    const detailPrefix = schema.detail.translatePrefix ? schema.detail.translatePrefix + '.' : '';

    // showLoader
    if (schema.detail.showLoader === undefined) { schema.detail.showLoader = schema.showLoader; }

    // Comprobamos el id.
    if (!schema.detail.id) { schema.detail.id = { param: 'id' }; }

    // Comprobamos la ruta.
    if (!schema.detail.route) { schema.detail.route = schema.name.singular + '/:id'; }
    if (typeof schema.detail.route === 'string' && !schema.detail.route.startsWith('/')) { schema.detail.route = '/' + schema.detail.route; }

    // save
    if (schema.detail.navigateBackOnSave === undefined) { schema.detail.navigateBackOnSave = true; }

    // delete
    if (schema.detail.navigateBackOnDelete === undefined) { schema.detail.navigateBackOnDelete = true; }

    if (schema.detail.confirmDelete === undefined) { schema.detail.confirmDelete = { confirm: true, header: 'buttons.delete', message: detailPrefix + 'DeleteMessage' }; }
    if (typeof schema.detail.confirmDelete === 'boolean') { schema.detail.confirmDelete = { confirm: schema.detail.confirmDelete, header: 'buttons.delete', message: detailPrefix + 'DeleteMessage' }; }
    const confirm: { confirm: boolean, header: string, message: string } = schema.detail.confirmDelete;
    if (translate && typeof confirm.header === 'string') { confirm.header = translate.instant(confirm.header); }
    if (translate && typeof confirm.message === 'string') { confirm.message = translate.instant(confirm.message); }

    // Propagate
    if (schema.detail.propagateDeletes === undefined && schema.detail.propagateChanges) { schema.detail.propagateDeletes = schema.detail.propagateChanges; }

    // Tomamos la fila de la caché.
    if (schema.detail.cache === undefined) { schema.detail.cache = false; }

    // El servicio actualiza las filas de la EntityQuery registrada por el componente de lista asociada con la misma entidad.
    if (schema.detail.updateCacheRow === undefined) { schema.detail.updateCacheRow = true; }

    // El título de la ficha.
    if (!schema.detail.headerText) { schema.detail.headerText = detailPrefix + 'detail_' + schema.friendly.singular; }

    // Traducimos el esquema.
    if (translate && typeof schema.detail.headerText === 'string') { schema.detail.headerText = translate.instant(schema.detail.headerText); }

    // flatRow
    if (schema.detail.flatRow === undefined) { schema.detail.flatRow = false; }


    //  list
    // ---------------------------------------------------------------------------------------------------
    if (!schema.list) { schema.list = {}; }

    // Comprobamos si se ha establecido un prefijo para las cadenas de traducción.
    if (schema.list.translatePrefix === undefined) { schema.list.translatePrefix = schema.friendly.plural; }

    const listPrefix = schema.list.translatePrefix ? schema.list.translatePrefix + '.' : '';

    // showLoader
    if (schema.list.showLoader === undefined) { schema.list.showLoader = schema.showLoader; }

    // Tomamos la fila de la caché.
    if (schema.list.cache === undefined) { schema.list.cache = false; }

    // Suscribe el componente a las notificaciones de fila (created, modified, deleted) para actualizar automáticamente la caché, es decir, las filas de la EntityQuery registrada por el componente.
    if (schema.list.notifyCacheRow === undefined) { schema.list.notifyCacheRow = true; }

    // Encadenamos las cláusulas del usuario con las del filtro original del modelo con OR en lugar de AND por defecto.
    if (schema.list.searchOR === undefined) { schema.list.searchOR = false; }


    if (schema.list.filter) {
      // Convertimos el filtro simple en complejo.
      const filter: FilterTypeComplex = typeof schema.list.filter === 'string' || Array.isArray(schema.list.filter) ? { pipe: schema.list.filter } : schema.list.filter;
      // Establecemos las propiedades por defecto del filtro complejo.
      if (filter.pipeToBackend === undefined) { filter.pipeToBackend = false; }
      if (filter.ignoreCase === undefined) { filter.ignoreCase = true; }
      if (filter.ignoreAccents === undefined) { filter.ignoreAccents = true; }
      if (filter.splitPipeWords === undefined) { filter.splitPipeWords = true; }
      if (filter.concatPipeWords === undefined) { filter.concatPipeWords = 'AND'; }
      if (filter.distinguishWords === undefined) { filter.distinguishWords = true; }
      if (filter.maxDistinctions === undefined) { filter.maxDistinctions = 3; }
      schema.list.filter = filter;
    }

    if (schema.list.groupBy) {
      // Convertimos la agrupación simple en compleja.
      const groupBy: GroupByTypeComplex = typeof schema.list.groupBy === 'string' || typeof schema.list.groupBy === 'function' ? { property: schema.list.groupBy } : schema.list.groupBy;
      // Establecemos las propiedades por defecto del filtro complejo.
      schema.list.groupBy = groupBy;
    }

    // El título del schema.listado.
    if (!schema.list.headerText) { schema.list.headerText = listPrefix + 'list_' + schema.friendly.plural; }
    // El botón para añadir nueva entidad.
    if (!schema.list.addNewText) { schema.list.addNewText = listPrefix + 'Add new ' + schema.friendly.singular; }
    // El botón de loading.
    if (!schema.list.loadingText) { schema.list.loadingText = listPrefix + 'Loading ' + schema.friendly.plural; }

    // Paginate results.
    if (typeof schema.list.paginate !== 'boolean') { schema.list.paginate = true; }
    if (typeof schema.list.itemsPerPage !== 'number') { schema.list.itemsPerPage = 100; }

    // Traducimos el esquema.
    if (translate && typeof schema.list.headerText === 'string') { schema.list.headerText = translate.instant(schema.list.headerText); }
    if (translate && typeof schema.list.addNewText === 'string') { schema.list.addNewText = translate.instant(schema.list.addNewText); }
    if (translate && typeof schema.list.loadingText === 'string') { schema.list.loadingText = translate.instant(schema.list.loadingText); }

    // console.log('schema => ', schema);
    // Devolvemos el esquema.
    return schema;
  }

  /**
   * Ejecuta la función con los argumentos suministrados y devuelve el resultado final, es decir, si el resultado no es un valor primitivo,
   * sino que es un observables o una promesas, entonces se suscribe para obtener el valor definitivo y devolverlo.
   */
  private static resolveFunction(fn: any, ...args: any[]): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      // // Obtenemos los nombres de los argumentos.
      // const reg = /\(([\s\S]*?)\)/;
      // const params = reg.exec(fn);
      // const names = params ? params[1].split(',').map(p => p.split(':')[0].trim()).filter(p => p) : [];
      // // Obtenemos todas las propiedades del host y sus prototipos.
      // const args2 = {}; args.map(a => (args2, a));
      // // Pasamos los argumentos exactos.
      // const args3 = names.map(n => args2[n]);
      // // // Añadimos una referencia el host.
      // // Object.assign(args2, { this: this.host });
      // // Invocamos la función.
      // console.log('args2 => ', args2);
      // console.log('fn => ', fn);
      // console.log('typeof fn => ', typeof fn);
      // // const result = fn(...Object.keys(args2).map(a => args2[a]));
      // const result = fn(...args3);

      // Invocamos la función.
      const result = fn(...args);
      // Evaluamos el resultado.
      if (result instanceof Observable) {
        // Función asíncrona. Nos suscribimos para recibir el valor del observable.
        result.pipe(first()).subscribe((value: any) => resolve(value));

      } else if (result instanceof Promise || typeof result?.then === 'function') {
        // Función asíncrona. Resolvemos la promesa para obtener el valor devuelto.
        result.then((value: any) => resolve(value)).catch(error => reject(error));

      } else {
        // Función síncrona. Devolvemos el valor primitivo.
        resolve(result);
      }
    });
  }

  /**
   * Resuelve una función de fila del modelo contra la fila o las filas suministradas.
   *
   * **Usage**
   *
   * ```typescript
   * class AbstractDetailComponent {
   *   saveRow(data?: any): Promise<any> {
   *     ...
   *     EntityModel.resolveRowHook(this.model.detail.saving, data, this).subscribe(row => {
   *       ...
   *     });
   *   }
   * }
   * ```
   * @category Resolvers
   */
  static resolveRowHook(resolver: object | ((data: any | any[], host: any) => any) | ((data: any | any[], host: any) => Observable<any>), data: any | any[], ...args: any[]): any | Observable<any | any[]> {
    const debug = false;
    return new Observable<any>((observer: any) => {
      if (debug) { console.log('EntityModel.resolveRowHook(resolver) => ', { resolver, typeof: typeof resolver, data }); }
      if (!resolver) {
        // Obtenemos el siguiente argumento que debería ser la fila.
        if (!data) { throw new Error(`No se ha establecido la fila o filas como segundo argumento para EntityModel.resolveRowHook()`); }
        // Si no hay función, simplemente devolvemos la fila o filas.
        observer.next(data);
        observer.complete();
        return;
      }
      if (typeof resolver === 'object') {

        if (debug) { console.log('EntityModel.resolveRowHook(resolver) => resolver is the row', resolver); }
        // El resolver mismo es la fila.
        observer.next(resolver);
        observer.complete();

      } else if (typeof resolver === 'function') {

        const fn: any = resolver;
        // Comprobamos si se trata de una única fila o de un array.
        if (Array.isArray(data)) {
          const rows: any[] = (data as any[]);
          // NOTA: Como la función suministrada es asíncrona, tenemos que esperar a que todos los observables de cada fila mapeada hayan finalizado.
          Promise.all(
            // Mapeamos el array para ir aplicando la función de mapeado a cada fila.
            rows.map(row => fn(row, ...args))

          ).then(mapedRows => {
            if (debug) { console.log('EntityModel.resolveRowHook(resolver) -> Promise.all() => ', mapedRows); }
            observer.next(mapedRows);
            observer.complete();
          });

        } else {
          if (debug) { console.log(this.constructor.name + '.resolveRowHook() -> resolveFunction() => ', { resolver, data, ...args }); }
          EntityModel.resolveFunction(resolver, data, ...args).then(result => observer.next(result)).catch(error => observer.error(error)).finally(() => observer.complete());
        }

      } else {
        // Devolvemos la misma fila o filas sin cambios.
        if (debug) { console.log('EntityModel.resolveRowHook(resolver) => default', data); }
        if (!data) { throw new Error(`No se ha establecido la fila o filas como segundo argumento`); }
        observer.next(data);
        observer.complete();
      }
    });
  }

  /** Resuelve el valor de una propiedad del objeto indicado.
   * @category Resolvers
   */
  static resolveProperty(parent: any, prop: string | ((obj: any) => any)): any {
    // Comprobamos el tipo de valor.
    if (typeof prop === 'function') {
      // Referenciamos la función.
      const fn: (parent: any) => any = prop;
      // Devolvemos el valor invocando la función suministrada.
      return fn(parent);

    } else {
      // Devolvemos el valor de la fila.
      return parent[prop];
    }
  }

  /** Resuelve asíncronamente el valor de una propiedad del objeto indicado.
   * @category Resolvers
   */
  static resolveAsyncProperty(parent: any, resolver: number | string | object | ((host: any) => any) | ((host: any) => Observable<any>), ...args: any[]): any | Observable<any> {
    const debug = false;
    return new Observable<any>((observer: any) => {
      if (debug) { console.log('EntityModel.resolveAsyncProperty(resolver) => ', {resolver, typeof: typeof resolver}); }
      if (!resolver) { observer.next(resolver); observer.complete(); return; }

      if (typeof resolver === 'object') {
        const obj: any = resolver;

        if (obj.hasOwnProperty('param')) {
          // console.log('...args => ', ...args);
          const route: ActivatedRoute = EntityModel.getInstanceOf(ActivatedRoute, ...args);
          if (route) {
            if (debug) { console.log('EntityModel.resolveAsyncProperty(resolver) => route'); }
            // Accedemos a los parámetros de la ruta.
            route.paramMap.pipe(first()).subscribe(params => observer.next(+params.get(obj.param)), error => observer.error(error), () => observer.complete());

          } else {
            observer.error('No instance has been provided for the "route" parameter');
          }

        } else {
          observer.error('Invalid object type argument for resolver');
        }

      } else if (typeof resolver === 'function') {

        if (debug) { console.log(this.constructor.name + '.resolveAsyncProperty() -> resolveFunction() => ', { resolver, parent, ...args }); }
        EntityModel.resolveFunction(resolver, parent, ...args).then(result => observer.next(result)).catch(error => observer.error(error)).finally(() => observer.complete());

      } else {
        // Devolvemos el valor de la propiedad resulta.
        if (debug) { console.log('EntityModel.resolveAsyncProperty(resolver) => default', resolver); }
        observer.next(parent[resolver]);
        observer.complete();
      }
    });
  }

  /** Resuelve asíncronamente un valor.
   * @category Resolvers
   */
  static resolveAsyncValue(resolver: number | string | object | ((host: any) => any) | ((host: any) => Observable<any>), ...args: any[]): any | Observable<any> {
    const debug = false;
    return new Observable<any>(observer => {
      if (debug) { console.log('EntityModel.resolveAsyncValue(resolver) => ', {resolver, typeof: typeof resolver}); }
      if (!resolver) { observer.next(resolver); observer.complete(); return; }

      if (typeof resolver === 'object') {

        const obj: any = resolver;

        if (obj.hasOwnProperty('param')) {
          // console.log('...args => ', ...args);
          const route: ActivatedRoute = EntityModel.getInstanceOf(ActivatedRoute, ...args);
          if (route) {
            if (debug) { console.log('EntityModel.resolveAsyncValue(resolver) => route'); }
            // Accedemos a los parámetros de la ruta.
            route.paramMap.pipe(first()).subscribe(params => observer.next(params.get(obj.param)), error => observer.error(error), () => observer.complete());

          } else {
            observer.error('No instance has been provided for the "route" parameter');
          }

        } else if (Array.isArray(obj)) {
          // Devolvemos el array.
          if (debug) { console.log('EntityModel.resolveAsyncValue(resolver) => Array', resolver); }
          observer.next(resolver);
          observer.complete();

        } else {
          // throw new Error('Invalid object type argument for resolver');
          if (debug) { console.log('EntityModel.resolveAsyncValue(resolver) => Object', resolver); }
          observer.next(resolver);
          observer.complete();
        }

      } else if (typeof resolver === 'function') {
        if (debug) { console.log(this.constructor.name + '.resolveAsyncValue() -> resolveFunction() => ', { resolver, ...args }); }
        EntityModel.resolveFunction(resolver, ...args).then(result => observer.next(result)).catch(error => observer.error(error)).finally(() => observer.complete());

      } else {
        // Devolvemos el valor hardcoded.
        if (debug) { console.log('EntityModel.resolveAsyncValue(resolver) => default', resolver); }
        observer.next(resolver);
        observer.complete();
      }
    });
  }

  /** Resuelve asíncronamente la url para la Api Rest.
   * @category Resolvers
   */
  static resolveUrl(options?: {
    host?: any,
    entityName?: string,
    id?: number | 'new' | undefined,
    fields?: ApiFieldsType,
    foreign?: { [key: string]: { [key: string]: string | RowHookFunction } },
    params?: string | string[] | ((host: any) => string) | ((host: any) => Observable<string>),
    search?: string | object | ((host: any) => any) | ((host: any) => Observable<any>),
    searchOR?: boolean,
    orderBy?: OrderByDirectionType | ApiFieldsType | OrderByTypeComplex,
  }): Promise<string> {

    if (!options) { options = {}; }

    return new Promise<string>((resolve: any, reject: any) => {

      const passEntitiesAsQueryParams = true;
      const entitiesSep = ',';
      const segmentsSep = passEntitiesAsQueryParams ? '' : '/';

      // Obtenemos las partes por separado.
      const main = options.entityName;

      // Comprobamos el id.
      const id: any = options.id ? `${segmentsSep}${options.id}` : '';

      // Obtenemos las entidades definidas en la propiedad `fields`.
      const entitiesFromFields: ApiEntity[] = ApiEntity.joinFields(ApiEntity.parseFields(main, options.fields));

      // Obtenemos las entidades foráneas declaradas en el modelo. Ej: foreign: { idpoblacion: { 'poblacion->origen': 'nombre' } }
      EntityModel.resolveForeignEntities(options.foreign, options.host).then(foreignEntities => {

        // Fusionamos las entidades extraídas de la definición de los campos con las obtenidas de la propiedad `foreign`.
        const entitiesWithForeigns: ApiEntity[] = ApiEntity.distinctEntities(entitiesFromFields, foreignEntities);
        // Obtenemos los campos de la entidad principal más los campos de las entidades foráneas.
        const fields: string[] = ApiEntity.stringifyFields(main, entitiesWithForeigns);

        // Extraemos las entidades de la propiedad `orderBy`.
        const order = options.orderBy?.hasOwnProperty('pipe') ? (options.orderBy as OrderByTypeComplex).pipe : isOrderByDirectionType(options.orderBy) ? undefined : options.orderBy as ApiFieldsType;
        const entitiesFromSort: ApiEntity[] = order ? ApiEntity.parseFields(main, order) : [];
        const sort: string[] = ApiEntity.stringifyFields(main, entitiesFromSort);

        // Fusionamos las entidades con las obtenidas de la propiedad `orderBy`.
        const entities: ApiEntity[] = ApiEntity.distinctEntities(entitiesWithForeigns, entitiesFromSort);
        const relatedEntities = entities.filter((entity: ApiEntity) => entity.table.aliasOrName !== main);
        const related = relatedEntities.length ? segmentsSep + relatedEntities.map(e => e.tableToUrl()).join(entitiesSep) : '';

        // Comprobamos si es una consulta de tipo POST /search -> GET
        const search = !id && options.search ? 'search/' + (options.searchOR ? '(OR)' : '') : '';

        // Obtenemos los atributos de la consulta.
        EntityModel.resolveAsyncValue(options.params, options.host).pipe(first()).subscribe((params: string) => {
          const queryString = [];
          if (passEntitiesAsQueryParams) {
            if (id) { queryString.push(`id=${id}`); }
            if (related) { queryString.push(`rel=${related}`); }
          }
          if (fields.length) { queryString.push(`fields=${fields.join(',')}`); }
          if (sort.length && !id) { queryString.push(`sort=${sort.join(',')}`); }
          if (params) { queryString.push(params); }

          // Unimos todas las partes de la URL.
          if (passEntitiesAsQueryParams) {
            resolve(search + main + (queryString.length ? '?' + queryString.join('&') : ''));
          } else {
            resolve(search + main + id + related + (queryString.length ? '?' + queryString.join('&') : ''));
          }
        });
      });
    });
  }

  /** Resuelve las entidades foráneas declaradas en la propiedad `foreign` del esquema. @category Resolvers */
  static resolveForeignEntities(foreigns: { [key: string]: { [key: string]: string | RowHookFunction } }, host?: any): Promise<ApiEntity[]> {
    return new Promise<ApiEntity[]>((resolve: any, reject: any) => {
      const entities: ApiEntity[] = [];
      if (foreigns) {
        for (const foreignKey of Object.keys(foreigns)) {
          // Ej: { 'poblacion->origen': 'nombre' } || { usuario: row => ({ nombre: row.nombre, apellidos: row.apellidos }) }
          const foreign = foreigns[foreignKey];
          // Iteramos las claves (puede que haya más de una declarando entidades anidadas).
          Object.keys(foreign).map(table => {
            // Ej: 'nombre,apellidos' || (row: any) => ({ nombre: row.nombre, apellidos: row.apellidos })
            const foreignFields = foreign[table];
            // Comprobamos el tipo de valor de la propiedad (definición de los campos)
            if (typeof foreignFields === 'function') {
              // Resolvemos la función pasando un objeto vacío como fila (solo nos interesan los nombres de las propiedades resultantes)
              EntityModel.resolveRowHook(foreignFields, {}, host).pipe(first()).subscribe((value: any) => {
                // Obtenemos los nombres de los campos.
                const fields = typeof value === 'object' ? Object.keys(value).join(',') : '';
                // Añadimos la entidad foránea.
                entities.push(new ApiEntity(table, fields));
              });
            } else {
              // Añadimos la entidad foránea.
              entities.push(new ApiEntity(table, foreignFields));
            }
          });
        }
      }
      resolve(entities);
    });
  }

  /**
   * Itera recursivamente hacia arriba por la jerarquía de rutas del componente en busca del parámetro solicitado.
   * @param route Instancia de la clase ActivatedRoute de la que extraer el valor del parámetro.
   * @param param Nombre del parámetro de la routa del que se quiere obtener el valor.
   * @param isRooted Indica si el snapshot ha empezado la búsqueda desde la raíz. Este parámetro no debe establecerse a menos que se pase la ráiz de snapshot.
   * @category Resolvers
   */
  static resolveParam(snapshot: ActivatedRouteSnapshot, param: string, isRooted = false): string {
    if (snapshot.params[param]) { return snapshot.params[param]; }
    if (snapshot.queryParams[param]) { return snapshot.queryParams[param]; }
    if (!isRooted) {
      return EntityModel.resolveParam(snapshot.root, param, true);
    } else {
      if (snapshot.firstChild) { return EntityModel.resolveParam(snapshot.firstChild, param, isRooted); }
    }
    throw new Error(`No se ha encontrado el parámetro '${param}' en el host suministrado para poder resolver la ruta.`);
  }

  // ---------------------------------------------------------------------------------------------------
  //  constructor
  // ---------------------------------------------------------------------------------------------------

  /** Inicializamos el modelo a partir del esquema indicado. Adicionalmente pueden suministrarse servicios de traducción o bien el inyector para poder resolver los valores adecuadamente. */
  constructor(schema: EntitySchema | string, ...args: any[]) {
    // if (debug) { console.log(this.constructor.name + '.constructor() -> schema => ', schema); }

    // Resolvemos el esquema.
    this.schema = EntityModel.resolveSchema(schema, ...args);
  }


  // ---------------------------------------------------------------------------------------------------
  //  resolvers
  // ---------------------------------------------------------------------------------------------------

  /**
   * Resuelve la url para la entidad actual del modelo.
   *
   * El componente de lista llama a esta función para resolver la ruta hacia el componente de detalle.
   *
   * Si no se establece ninguna ruta, se utiliza la siguiente fórmula por defecto:
   * ```typescript
   * schema.name.singular + '/:id'
   * ```
   *
   * **Usage**
   *
   * Ejemplo para rutas anidadas:
   * ```
   * detail: {
   *   route: 'servicio/:idservicio/ofertas/:id',
   * },
   * ```
   * El componente resuelve automáticamente el parámetro `:idservicio` obteniéndolo de la ruta actual, y el
   * parámetro `:id` de la fila seleccionada como `row[primaryKey]`.
   *
   * Para resoluciones complejas se puede suministrar una función propia:
   * ```
   * detail: {
   *   route: (row: any, host: any) => ...,
   * },
   * ```
   * o bien se puede sobreescribir la función {@link selectRow}() del componente {@link AbstractListComponent}.
   * @category Resolvers
   */
  resolveRoute(resolver: any, ...args: any[]): Observable<any> {
    const debug = false;
    if (debug) { console.log('EntityModel.resolveRoute(resolver) => ', {resolver, typeof: typeof resolver}); }
    return new Observable<any>(observer => {
      if (!resolver) { observer.next(resolver); observer.complete(); return;  }

      if (typeof resolver === 'function') {
        if (debug) { console.log(this.constructor.name + '.resolveRoute() -> resolveFunction() => ', { resolver, ...args }); }
        EntityModel.resolveFunction(resolver, ...args).then(result => observer.next(result)).catch(error => observer.error(error)).finally(() => observer.complete());

      } else if (typeof resolver === 'string') {

        const value: string = resolver;
        // Obtenemos el siguiente argumento que debería ser la fila.
        const row = args[0];
        if (!row) { throw new Error('No se ha suministrado la fila de datos para resolver la ruta'); }
        if (!row.hasOwnProperty(this.primaryKey)) { throw new Error('No se ha encontrado la clave primaria en la fila de datos suministrada para resolver la ruta'); }
        // Obtenemos el siguiente argumento que debería ser el host.
        const host = args[1];
        if (!host || !(host.route instanceof ActivatedRoute)) { throw new Error(`No se ha encontrado una instancia de 'ActivatedRoute' en el host para poder resolver los parámetros de la ruta.`); }
        const route: ActivatedRoute = host.route;
        // Nos quedamos con todos los segmentos que no sean parámetros.
        const segments = value.replace('_', '-').split('/').map(s => s === ':id' ? row[this.primaryKey] : s.startsWith(':') ? EntityModel.resolveParam(route.snapshot, s.replace(':', '')) : s);
        // Devolvemos el array con la ruta y el identificador.
        observer.next([segments.join('/')]);
        observer.complete();

      } else {
        observer.complete();
        throw new Error('Invalid argument type for resolver');
      }
    });
  }

  /**
   * Resuelve la url para la entidad actual.
   *
   *  ```typescript
   * // Formulas
   * main/related/search?fields=fields&sort=sort
   * main/id/related?fields=fields&sort=sort
   *
   * // Examples
   * const url = 'festivos/tarifa?fields=tarifa(descripcion->tarifa)&sort=tarifa(descripcion),mes,dia'
   * const url = 'precios_tarifa/poblacion->origen(idorigen)?fields=precio,origen(nombre)&sort=origen(nombre),-precio'
   * ```
   * @category Resolvers
   */
  resolveUrl(options?: { host?: any, entityName?: string, id?: number | 'new', customFields?: string }): Promise<string> {

    if (!options) { options = {}; }

    const entityName = options.entityName || EntityName.resolve(this.backend).plural;
    const id: any = options.id  || undefined;
    const fields = options.customFields || this.schema.list.fields;
    const { foreign, orderBy, search, searchOR, params } = this.schema.list;

    return EntityModel.resolveUrl({ entityName, id, fields, foreign, orderBy, search, searchOR, params, host: options.host });
  }
}


/** Expone métodos que facilitan el manejo de los nombres de las entidades. */
export abstract class EntityName {

  /** Devuelve la forma plural del nombre indicado */
  static plural(entityName: string | EntityType, compare: CompareNames = 'Optimistic', ...args: any[]): string {
    // Obtenemos el nombre de la entidad como un string.
    return EntityName.resolve(entityName, ...args).plural;
  }

  /** Devuelve la forma singular del nombre indicado */
  static singular(entityName: string | EntityType, compare: CompareNames = 'Optimistic', ...args: any[]): string {
    // Obtenemos el nombre de la entidad como un string.
    return EntityName.resolve(entityName, ...args).singular;
  }

  /** Comprueba si dos entidades tienen el mismo nombre. */
  static equals(entityNameA: string | EntityType, entityNameB: string | EntityType, compare: CompareNames = 'Optimistic', ...args: any[]): boolean {
    if (!entityNameA || !entityNameB) { return false; }
    // ---------------------------------------------------------------------------------------------------
    // Resolvemos las entidades que vamos a comparar.
    // NOTA: Para las claves foráneas nos puede llegar una entidad en singular y terminada en 's'
    // que se resolvería como { singular: 'pai', plural: 'pais' }. Cuando nos llegue un string forzamos la resolución.
    // ---------------------------------------------------------------------------------------------------
    const A = typeof entityNameA === 'string' ? { singular: entityNameA, plural: entityNameA } : EntityName.resolve(entityNameA, ...args);
    const B = typeof entityNameB === 'string' ? { singular: entityNameB, plural: entityNameB } : EntityName.resolve(entityNameB, ...args);
    // ---------------------------------------------------------------------------------------------------

    // Comprobamos cual es la actitud deseada durante la comparación.
    // ---------------------------------------------------------------------------------------------------
    // NOTA: Es importante tener en cuenta el contexto antes de decidir la actitud durante la comparación
    // dado que no siempre podremos delegar en la resolución de nombres de entidad.

    // Por ejemplo: Dado A = { singular: 'precio_tarifa', plural: 'precios_tarifa' }
    // Si B = 'precios_tarifa', resolve() => B = { singular: 'precios_tarifa', plural: 'precios_tarifa' }
    // Si la comparación es 'Optimistic' sólo comparará el plural y el resultado será true.
    // En cambio si es 'Pessismistic' devolverá false pq las formas del singular no coinciden.

    // Otro ejemplo: Dado A = { singular: 'midirecciontaxista', plural: 'misdireccionestaxistas' }
    // Si B = 'misdireccionestaxistas', resolve() => B = { singular: 'misdireccionestaxista', plural: 'misdireccionestaxistas' }
    // Si la comparación es 'Optimistic' sólo comparará el plural y el resultado será true.
    // En cambio si es 'Pessismistic' devolverá false pq las formas del singular no coinciden.
    // ---------------------------------------------------------------------------------------------------
    if (compare === 'Optimistic') {
      // Comprobamos si coincide el plural.
      const result = A.plural === B.plural;
      // Si coincide plural devolvemos siempre true.
      if (result) { return true; }
      // Comprobamos si coincide el singular (pero no ambos a la vez).
      return A.singular === B.singular ? true : false;

    } else if (compare === 'Pessimistic') {
      // Forzamos la comparación más estricta.
      return A.singular === B.singular && A.plural === B.plural ? true : false;
    }
  }

  /** Devuelve una instancia del tipo EntityName */
  static resolve(entityName: string | EntityType, ...args: any[]): EntityName {
    const debug = false;
    // Intentamos obtener el servicio de traducción.
    const translate: TranslateService = EntityModel.getInstanceOf(TranslateService, ...args);

    // EntityModel
    if (entityName instanceof EntityModel) {
      const model: EntityModel = (entityName as EntityModel);
      const entity = { singular: model.name.singular, plural: model.name.plural };
      if (debug) { console.log('entityName instanceof EntityModel => ', { entityName, entity }); }
      return entity;
    }

    // EntityName | EntitySchema
    if (typeof entityName === 'object') {

      if (entityName.hasOwnProperty('name')) {
        // EntitySchema
        const schema: EntitySchema = (entityName as EntitySchema);
        const model: EntityModel = new EntityModel(schema, translate || []);
        const entity = { singular: model.name.singular, plural: model.name.plural };
        if (debug) { console.log('entityName.hasOwnProperty(name) => ', { entityName, model, entity }); }
        return entity;

      } else if (entityName.hasOwnProperty('singular') && entityName.hasOwnProperty('plural')) {
        // EntityName
        const name: EntityName = (entityName as EntityName);
        const entity = { singular: name.singular, plural: name.plural };
        if (debug) { console.log('entityName.hasOwnProperty(singular) => ', { entityName, entity }); }
        return entity;

      } else if (entityName.hasOwnProperty('model') && (entityName as any).model instanceof EntityModel) {
        const model: EntityModel = (entityName as any).model;
        const entity = { singular: model.name.singular, plural: model.name.plural };
        if (debug) { console.log('entityName instanceof EntityModel => ', { entityName, entity }); }
        return entity;
      }

    } else if (typeof entityName === 'string') {
      // Resolvemos el nombre partiendo de un string.
      const name: string = entityName as string;
      // Comprobamos la terminación del nombre.
      if (name.endsWith('s')) {
        // Obtenemos el singular quitando la 's' del final del nombre.
        const entity = { singular: name.substring(0, name.length - 1), plural: name };
        if (debug) { console.log('typeof entityName === string => ', { entityName, entity }); }
        return entity;

      } else {
        // ---------------------------------------------------------------------------------------------------
        // NOTA: Atención: si hay un plural que no termina con 's', como 'precios_tarifa',
        // el código de este bloque generará un par incorrecto con plural 'precios_tarifas'.
        // Forzamos que singular y plural tengan el mismo valor.
        // ---------------------------------------------------------------------------------------------------
        // // Obtenemos el plural añadiendo una 's' al final del nombre.
        // const entity = { singular: name, plural: name + 's' };
        // if (debug) { console.log('typeof entityName === string => ', { entityName, entity }); }
        // return entity;
        // ---------------------------------------------------------------------------------------------------
        const entity = { singular: name, plural: name };
        if (debug) { console.log('typeof entityName === string => ', { entityName, entity }); }
        return entity;
      }
    }
  }
}

