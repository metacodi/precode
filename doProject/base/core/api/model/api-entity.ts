import { AliasName } from './alias-name';
import { ApiFieldsType } from './api.types';

// @dynamic
export class ApiEntity {
  table: AliasName;
  columns: AliasName[] = [];
  relation?: string;

  static parseFields(entityName: string, fields?: ApiFieldsType, options?: { reduceNestedFields?: boolean }): ApiEntity[] {
    // if (!fields) { return []; }
    if (!options) { options = {}; }
    if (options.reduceNestedFields === undefined) { options.reduceNestedFields = false; }
    const entities: ApiEntity[] = [];

    if (!fields) {
      // Ej: 'detallesFactura->detalles()'
      entities.push(new ApiEntity(entityName));

    } else if (typeof fields === 'string') {
      // Ej: 'nombre,apellidos->cognoms'
      const segments = ApiEntity.splitFields(fields);
      for (const segment of segments) {
        if (segment.includes('(')) {
          // Ej: 'tarifas(descripcion)'
          const { table, columns, direction } = ApiEntity.splitTableAndFields(segment, options);
          entities.push(new ApiEntity(table, direction + columns.join(',')));
          // const [tableProp, columns] = segment.replace(')', '').split('(');
          // const optional = tableProp.endsWith('?');
          // const table = optional ? tableProp.slice(0, -1) : tableProp;
          // entities.push(new ApiEntity(table, direction + columns.join(',')));

        } else if (segment.includes('.')) {
          // Ej: 'tarifas.descripcion'
          const { table, columns, direction } = ApiEntity.splitTableAndFields(segment, options);
          entities.push(new ApiEntity(table, direction + columns.join('.')));
          // const [tableProp, ...columns] = segment.split('.');
          // const optional = tableProp.endsWith('?');
          // const table = optional ? tableProp.slice(0, -1) : tableProp;
          // const desc = table.startsWith('-') ? '-' : '';
          // entities.push(new ApiEntity(table.replace('-', ''), desc + columns.join('.')));

        } else {
          entities.push(new ApiEntity(entityName, segment));
        }
      }

    } else if (Array.isArray(fields)) {
      // Ej: ['nombre,apellidos->cognoms', { tarifa: 'descripcion', 'poblacion->origen(idorigen)': 'nombre' }]
      for (const field of fields) {
        // Llamada recursiva.
        entities.push(...ApiEntity.parseFields(entityName, field));
      }

    } else if (typeof fields === 'object') {
      // Ej: { tarifa: 'descripcion' }
      // Ej: { 'poblacion->origen(idorigen)': 'nombre' }
      for (const prop in fields) {
        if (fields.hasOwnProperty(prop)) {
          // Comprobamos si es una entidad con alias.
          if (typeof fields[prop] === 'object') {
            // Ej: { 'poblacion->origen(idorigen)': 'nombre' }
            for (const entity of ApiEntity.parseFields(prop, fields[prop])) {
              // Establecemos el alias que falta.
              entity.table.alias = prop;
              // Añadimos la entidad al array.
              entities.push(entity);
            }

          } else {
            // Ej: { tarifa: 'descripcion' }
            entities.push(...ApiEntity.parseFields(prop, fields[prop]));
          }
        }
      }

    } else {
      throw new Error(`Invalid 'fields' declaration for entity '${entityName}'.`);
    }
    return entities;
  }

  static splitTableAndFields(prop: string, options?: { reduceNestedFields?: boolean }): { table: string, columns: string[], direction: '-' | '', optional: boolean } {
    if (!options) { options = {}; }
    if (options.reduceNestedFields === undefined) { options.reduceNestedFields = false; }

    if (prop.includes('(')) {
      // Ej: 'user(nombre,apellidos)'
      const [tableProp, columns] = prop.replace(')', '').split('(');
      const optional = tableProp.endsWith('?');
      const table = optional ? tableProp.slice(0, -1) : tableProp;
      const direction = table.startsWith('-') || table.endsWith('-') ? '-' : '';
      return {
        table: table.startsWith('-') ? table.substring(1) : (table.endsWith('-') ? table.slice(0, -1) : table),
        columns: columns.split(',').map(s => s.trim()).filter(s => !!s),
        direction, optional
      };

    } else if (prop.includes('.')) {
      // Ej: 'cliente?.user?.nombre'
      const [tableProp, ...columns] = options.reduceNestedFields ? ApiEntity.reduceNestedField(prop).split('.') : prop.split('.');
      const optional = tableProp.endsWith('?');
      const table = optional ? tableProp.slice(0, -1) : tableProp;
      const direction = table.startsWith('-') || table.endsWith('-') ? '-' : '';
      return {
        table: table.startsWith('-') ? table.substring(1) : (table.endsWith('-') ? table.slice(0, -1) : table),
        columns: [columns.join('.')],
        direction, optional
      };

    } else {
      const optional = prop.endsWith('?');
      return {
        table: '',
        columns: [optional ? prop.slice(0, -1) : prop],
        direction: '', optional
      };
    }
  }

  /** Reduce el datapath a su expresión final formada por el último campo de la expresión precedido de su entidad.
   * ```typescript
   * const prop = 'cliente?.user?.nombre';
   * const reduced = reduceNestedField(prop);
   * console.log(reduced); // => 'user?.nombre'
   * ```
   */
  static reduceNestedField(prop: string): string {
    if (!prop) { return ''; }
    if (!prop.includes('.')) { return prop; }
    const parts = prop.split('.');
    if (parts.length === 1) { return prop; }
    // Ej: 'cliente?.user?.nombre'
    const res = [];
    // 'nombre'
    res.push(parts.pop());
    // 'user?'
    res.push(parts.pop());
    // 'user?.nombre'
    return res.reverse().join('.');
  }

  /** Separa los campos por entidades.  */
  static splitFields(fields: string): string[] {
    // Ej: 'tarifas(descripcion),mes,dia' => ['tarifas(descripcion)', 'mes', 'dia']
    const camps = fields.match(/([^(,]*(?:\([^\)]*\))?)|(?:,)/g) || [];
    return camps.map(s => s.trim()).filter(s => !!s);
  }

  /** Converts ApiEntities to its equivalent string notation. */
  static stringifyFields(mainEntity: string, entities: ApiEntity[], excludeMainFields = false): string[] {
    return (entities || [])
      .filter(entity => !excludeMainFields || entity.table.name === mainEntity)
      .filter(entity => entity.columnsToUrl() !== '')
      .map(entity => entity.table.name === mainEntity ? entity.columnsToUrl() : entity.table.aliasOrName + '(' + entity.columnsToUrl() + ')')
      .filter(s => !!s.trim())
    ;
  }

  static joinFields(entities: ApiEntity[]): ApiEntity[] {
    const joined: ApiEntity[] = [];
    // Ej: idreg,tarifa(idreg),precio,tarifa(descripcion) -> idreg,precio,tarifa(idreg,descripcion)
    for (const entity of (entities || [])) {
      // Buscamos la entidad actual entre las procesadas.
      const match = joined.find(e => e.tableToUrl() === entity.tableToUrl());
      // Comprobamos si existe en la nueva colección.
      if (match) {
        // Añadimos las columnas de la entidad actual que no estén presentes en la existente.
        match.columns.push(...entity.columns.filter(column => !match.columns.find(c => column.toUrl() === c.toUrl())));

      } else {
        // Creamos la nueva entidad con sus columnas.
        joined.push(entity.clone());

      }
    }
    return joined;
  }

  static distinctEntities(...entities: ApiEntity[][]): ApiEntity[] {
    // NOTA: Cal desgranar les entitats. No funciona quan fem servir una fòrmula directa
    // com per exemple: return [].concat(...(entities || [])).filter( ... );
    const all: ApiEntity[] = []; entities.map((e: ApiEntity[]) => all.push(...e));
    return all.filter(
      (entity1: ApiEntity, i: number, result: ApiEntity[]) => result.findIndex((entity2: ApiEntity) =>
        // Filtramos las repetidas: coinciden en nombre y/o alias.
        (entity1.table.name === entity2.table.name && entity1.table.alias === entity2.table.alias && entity1.relation === entity2.relation) ||
        (entity1.table.alias && !entity2.table.alias && entity1.table.alias === entity2.table.name) ||
        (entity2.table.alias && !entity1.table.alias && entity2.table.alias === entity1.table.name)
      ) === i
    );
  }


  constructor(table: string | AliasName, columns?: string | AliasName[]) {
    // Resolvemos el nombre de la tabla.
    this.table = AliasName.parse(table);
    // Comprobamos si tb. se ha indicado una relación explícita.
    if (this.table.alias && (this.table.alias.includes('(') || this.table.alias.includes('['))) {
      // Extraemos la relación explícita.
      const parts: string[] = this.table.alias.split(/[\(\[]/);
      this.table.alias = parts[0];
      this.relation = parts[1].replace(/[\)\]]/g, '');

    } else if (this.table.name && (this.table.name.includes('(') || this.table.name.includes('['))) {
      // Extraemos la relación explícita.
      const parts: string[] = this.table.name.split(/[\(\[]/);
      this.table.name = parts[0];
      this.relation = parts[1].replace(/[\)\]]/g, '');
    }
    // Resolvemos las columnas de la tabla.
    let fields: (string | AliasName)[] = [];
    if (typeof columns === 'string') {
      fields = (columns as string).split(',').map(s => s.trim()).filter(s => !!s);
    } else if (Array.isArray(columns)) {
      fields = columns.filter(s => !!s);
    }
    if (fields.length) {
      for (const field of fields) {
        this.columns.push(AliasName.parse(field));
      }
    }
  }

  tableToUrl(): string { return this.table.toUrl() + (this.relation ? `(${this.relation})` : ''); }

  columnsToUrl(): string { return this.columns.map(column => column.toUrl()).join(','); }

  clone(): ApiEntity { return new ApiEntity(this.tableToUrl(), this.columns.map(column => column.clone())); }

  toString(): string { return this.tableToUrl() + '(' + this.columnsToUrl() + ')'; }
}
