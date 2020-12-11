import { Pipe, PipeTransform, EventEmitter } from '@angular/core';
import { exception } from 'console';

import { OrderByType, OrderByDirectionType, isOrderByDirectionType, ApiEntity } from 'src/core/api';
import { compareValues } from 'src/core/util';


/**
 * Pipe for sorting arrays of values either primitives or objects indicating their properties to compare.
 *
 * ### Sorting an array of values either primitives or objects.
 *
 * ```html
 * <!-- Sorting ascending an array of primtives -->
 * <ion-item *ngFor="let value of primitives | orderBy"><!-- by default: 'asc' -->
 * <ion-item *ngFor="let value of primitives | orderBy:'asc'">
 * <ion-item *ngFor="let value of primitives | orderBy:'+'">
 * <ion-item *ngFor="let value of primitives | orderBy:1">
 * <ion-item *ngFor="let value of primitives | orderBy:'desc'">
 * <ion-item *ngFor="let value of primitives | orderBy:'-'">
 * <ion-item *ngFor="let value of primitives | orderBy:-1">
 *
 * <!-- Sorting an array of objects -->
 * <ion-item *ngFor="let value of objects | orderBy:'name'">
 * <ion-item *ngFor="let value of objects | orderBy:'name, age'">
 * <ion-item *ngFor="let value of objects | orderBy:'name, -age'">
 * <ion-item *ngFor="let value of objects | orderBy:'name, age desc'">
 * <ion-item *ngFor="let value of objects | orderBy:['name']">
 * <ion-item *ngFor="let value of objects | orderBy:['name', 'age']">
 * <ion-item *ngFor="let value of objects | orderBy:['name', '-age']">
 * <ion-item *ngFor="let value of objects | orderBy:'tarifa(descripcion)'">
 * ```
 *
 * @ngModule AppCommonModule
 */
@Pipe({
  name: 'orderBy',
  pure: false,
})
export class OrderByPipe implements PipeTransform {

  transform(values?: any[], order?: OrderByType): any {
    if (!values || !values.length) { return []; }

    // Evaluamos el tipo de valores.
    if (typeof values[0] === 'object') {

      // Para filas (objects) se requiere un valor para direction, sino devolvemos el array.
      if (!order) { return values; }

      // console.log('order => ', order);
      let pipe = order;
      // Compropbamos si es un definición compleja.
      if (typeof order === 'object') { pipe = (order as any).pipe; }
      // console.log('pipe 1 => ', pipe);
      // Pasamos de 'state, -price' a ['state', '-price']
      if (typeof pipe === 'string') { pipe = this.splitFields(pipe); }
      // console.log('pipe 2 => ', pipe);
      // Array de objetos.
      if (!pipe || !Array.isArray(pipe) || !pipe.length) { throw new Error('Invalid arguments for sorting an array of objects. An array of properties was expected.'); }

      // Normalizamos las propiedades.
      const properties = pipe.map(prop => this.normalizeProperty(prop));
      // console.log('properties => ', properties);
      // Aplicamos la función de ordenación al array.
      const sorted = values.sort(this.compareProperties(properties));
      // Realizamos la llamada al callback.
      if (typeof order === 'object' && typeof (order as any).callback === 'function') { (order as any).callback((order as any).host); }
      return sorted;

    } else {
      // Array de primitivos.
      if (!order) { order = 'asc'; }
      // Solo se espera una dirección para ordenar los primitivos.
      if (!isOrderByDirectionType(order)) { throw new Error('Invalid arguments for sorting an array of primitives. A direction of type OrderByDirectionType was expected.'); }
      // Aplicamos la función de ordenación al array.
      const sorted = values.sort((a, b) => compareValues(a, b, { direction: this.normalizeDirection(order as OrderByDirectionType) }));
      // Realizamos la llamada al callback.
      if (typeof order === 'object' && typeof (order as any).callback === 'function') { (order as any).callback((order as any).host); }
      return sorted;
    }
  }

  private splitFields(fields: string): string[] {
    // Ej: 'tarifas(descripcion), mes, dia' => [ 'tarifas(descripcion)', 'mes', 'dia' ]
    return fields.match(/([^(,]*(?:\([^\)]*\))?)|(?:,)/g).map(s => s.trim()).filter(s => !!s);
  }

  private normalizeProperty(prop: any): any {
    const debug = false;
    if (debug) { console.log(`normalizeProperty(prop) => `, prop); }
    // Parseamos las cadenas de texto.
    if (typeof prop === 'string') {
      if (prop.includes('(')) {
        // Ej: 'user(email)'
        const { table, columns, direction } = ApiEntity.splitTableAndFields(prop);
        if (columns.length > 1) { throw new Error('No se admiten múltiples campos en la notación con paréntesis para las cláusulas del pipe OrderBy.'); }
        return { [this.sanitizePropertyName(table)]: this.normalizeProperty(direction + columns.join(',')) };
        // const parts = prop.replace(')', '').split('(');
        // if (debug) { console.log(`prop.includes('(') => `, { parts }); }
        // const direction = parts[0].startsWith('-') || parts[0].endsWith('-') ? '-' : '';
        // return { [this.sanitizePropertyName(parts[0])]: this.normalizeProperty(direction + parts[1]) };

      } else if (prop.includes('.')) {
        // Ej: 'cliente?.user?.email'
        const { table, columns, direction } = ApiEntity.splitTableAndFields(prop);
        return { [this.sanitizePropertyName(table)]: this.normalizeProperty(direction + columns.join('.')) };
        // const [table, ...rest] = prop.split('.');
        // if (debug) { console.log(`prop.includes('.') => `, { table, rest }); }
        // const direction = table.startsWith('-') ? '-' : '';
        // return { [this.sanitizePropertyName(table)]: this.normalizeProperty(rest.map(s => direction + s.trim()).filter(s => !!s).join('.')) };

      } else {
        // Pasamos de 'field desc' a ['field', 'desc']
        const parts = prop.match(/^([^\s]+)(\s*desc)?/i);
        prop = [parts[1], parts[2] && parts[2].toLowerCase() === 'desc' ? 'desc' : 'asc'];
      }

    } else if (typeof prop === 'object' && !Array.isArray(prop)) {
      if (debug) { console.log(`typeof prop === 'object' && !Array.isArray(prop) ? `, true); }
      for (const p in prop) {
        if (prop.hasOwnProperty(p)) {
          // Ej: { tarifa: 'descripcion' }
          if (debug) { console.log(`typeof prop === 'object' && !Array.isArray(prop) => `, { [p]: prop[p] }); }
          return { [this.sanitizePropertyName(p)]: this.normalizeProperty(prop[p]) };
        }
      }
    }
    // Desestructuramos el valor.
    let [propName, propDirection] = prop;
    // Pasamos de '-field' a ['field', 'desc']
    if (propName[0] === '-') { [propName, propDirection] = [propName.substring(1), 'desc']; }
    // Pasamos de ['field', 'desc'] a ['-field']
    if (debug) { console.log(`normalizeProperty finally => `, { propName, propDirection }); }
    return (this.normalizeDirection(propDirection) === -1 ? '-' : '') + propName;
  }

  private sanitizePropertyName(prop: string): string {
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

  private normalizeDirection(direction?: OrderByDirectionType): 1|-1 {
    // Valor por defecto.
    if (!direction) { direction = 'asc'; }
    // Normalizamos la dirección reduciéndola a una expresión numérica.
    return direction === 'desc' || direction === '-' || direction === -1 ? -1 : 1;
  }

  /** Obtiene el valor primitivo resolviendo el árbol del valor cuando es un objeto */
  private getTerminalValue(value: any, prop: any): any {
    if (!value) { return undefined; }
    // Ej: value = { precio: 5.5, tarifa: { descripcion: 'T-1' } }
    if (typeof prop === 'string') {
      // Ej: prop = 'precio'
      return value[this.sanitizePropertyName(prop)];

    } else if (typeof prop === 'object') {
      // Ej: prop = { tarifa: 'descripcion' }
      for (const p in prop) {
        // Ej: p = 'tarifa'
        if (prop.hasOwnProperty(this.sanitizePropertyName(p))) {
          const sp = this.sanitizePropertyName(p);
          // Ej: value[tarifa] = { descripcion: 'T-1' }, prop[tarifa] = 'descripcion'
          return this.getTerminalValue(value[sp], prop[sp]);
        }
      }
      return undefined;

    } else {
      throw new Error(`Invalid type '${typeof prop}' of property for compare in OrderByPipe`);
    }
  }

  /** Obtiene el valor primitivo resolviendo el árbol del valor cuando es un objeto */
  private getDirection(prop: any): 1 | -1 {
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
          return this.getDirection(prop[p]);
        }
      }
      return 1;

    } else {
      throw new Error(`Invalid type '${typeof prop}' of property for obtain direction in OrderByPipe`);
    }
  }

  private compareProperties = (properties: any) => (a: any, b: any) => properties.map((o: any) => {
    // let direction: 1|-1 = 1;
    const direction = this.getDirection(o);
    const valueA = this.getTerminalValue(a, o);
    const valueB = this.getTerminalValue(b, o);
    if (valueA === undefined || valueB === undefined) { return 0; }
    // console.log('values => ', { valueA, valueB });
    // return this.compareValues(a[o], b[o], direction);
    return compareValues(valueA, valueB, { direction });
  }).reduce((p: any, n: any) => p ? p : n, 0)

}
