import { Pipe, PipeTransform } from '@angular/core';

import { ApiEntity, OrderByDirectionType } from 'src/core/api';

import { GroupByTypeComplex } from '../model/entity-schema';


export interface GroupByValue {
  key: string | number | boolean | null;
  rows: any[];
  /** Añadimos una propiedad al grupo para la ordenación de grupos. */
  orderBy?: string;
}

@Pipe({
    name: 'groupBy',
    pure: false
})
export class GroupByPipe implements PipeTransform {
  private debug = false;

  transform(rows: any[], groupBy: GroupByTypeComplex, orderBy?: string): Array<any> {
    if (!rows || !Array.isArray(rows)) { return [{ key: '', rows: [] }]; }
    if (this.debug) { console.log('GroupByPipe => ', { rows, groupBy }); }

    // const arr: { [key: string]: Array<any> } = {};
    const groups: GroupByValue[] = [];
    const prop = groupBy?.property;
    const host = groupBy?.host;

    // Si no se establece ningún campo, se devuelven todas las filas.
    if (!prop || !rows.length) { return [{ key: '', rows }]; }

    // Agrupamos las filas.
    for (const row of rows) {
      // Obtenemos el valor de la propiedad (o los valores combinados con un espacio si hay más de una propiedad).
      const value: any = (typeof prop === 'function' ? prop(row, host) : this.getValue(row, prop)) || null;
      // Comprobamos si hay que crear un nuevo grupo.
      let group: GroupByValue = groups.find(g => g.key === value);
      if (!group) {
        // Creamos el nuevo grupo.
        group = { key: value, rows: [] };
        // Añadimos la propiedad para ordenar los grupos en lugar de la clave.
        if (orderBy) { group.orderBy = this.getValue(row, orderBy); }
        // Añadimos el grupo a la colección.
        groups.push(group);
      }
      // Añadimos la fila al grupo.
      group.rows.push(row);
    }
    // Devolvemos las filas agrupadas.
    return groups;
  }

  getValue(row: any, prop: string): any {
    // Comprobamos si hay que agrupar por múltiples campos.
    if (prop.includes(',')) {
      // Combinamos los valores de cada propiedad.
      return prop.split(',').map(s => s.trim()).filter(s => !!s).map(s => this.getValue(row, s)).join(' ').trim();

    } else {
      // Comprobamos si es la declaración de un datapath.
      if (prop.includes('.')) {
        // Ej: 'cliente?.user?.email'
        const { table, columns, optional } = ApiEntity.splitTableAndFields(prop);
        // const [tableProp, ...columns] = prop.split('.');
        // const optional = tableProp.endsWith('?');
        // const table = optional ? tableProp.slice(0, -1) : tableProp;
        // Comprobamos que la propiedad existe en la fila.
        if (!optional && row && !row.hasOwnProperty(table)) { throw new Error(`No se ha encontrado la propiedad '${table}' en la fila filtrada.`); }
        // Comprobamos que tenga un valor válido para ser comparado.
        if (row[table]) {
          // Llamada recursiva.
          return this.getValue(row[table], columns.join('.'));

        } else {
          return '';
        }

      } else {
        // Devolvemos el valor terminal.
        return row[prop];
      }
    }
  }

}
