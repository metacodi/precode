import { Pipe, PipeTransform, EventEmitter } from '@angular/core';
import { exception } from 'console';

import { OrderByType, OrderByDirectionType, isOrderByDirectionType, ApiEntity, OrderByTypeComplex, normalizeDirection, resolveDirection, sanitizePropertyName } from 'src/core/api';
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

  static isComplex(order: any): boolean {
    return typeof order === 'object' && typeof order.callback === 'function';
  }

  transform(values?: any[], order?: OrderByType): any {
    if (!values || !values.length) { return []; }
    // Obtenemos una referencia del filtro complejo si es posible.
    const complex = OrderByPipe.isComplex(order) ? order as OrderByTypeComplex : undefined;

    // Evaluamos el tipo de valores.
    if (typeof values[0] === 'object') {

      // Para filas (objects) se requiere un valor para direction, sino devolvemos el array.
      if (!order) { return values; }

      // console.log('order => ', order);
      let pipe = order;
      // Compropbamos si es un definición compleja.
      if (complex) { pipe = complex.pipe; }
      // Pasamos de 'state, -price' a ['state', '-price']
      if (typeof pipe === 'string') { pipe = ApiEntity.splitFields(pipe); }
      // console.log('pipe 2 => ', pipe);
      // Array de objetos.
      if (!pipe || !Array.isArray(pipe) || !pipe.length) { throw new Error('Invalid arguments for sorting an array of objects. An array of properties was expected.'); }

      // Normalizamos las propiedades.
      const properties = pipe.map(prop => this.normalizeProperty(prop));
      // console.log('properties => ', properties);
      // Aplicamos la función de ordenación al array.
      const sorted = values.sort(this.compareProperties(properties));
      // Realizamos la llamada al callback.
      if (complex) { complex.callback(complex.host); }
      return sorted;

    } else {
      // Array de primitivos.
      if (!order) { order = 'asc'; }
      // Solo se espera una dirección para ordenar los primitivos.
      if (!isOrderByDirectionType(order)) { throw new Error('Invalid arguments for sorting an array of primitives. A direction of type OrderByDirectionType was expected.'); }
      // Aplicamos la función de ordenación al array.
      const sorted = values.sort((a, b) => compareValues(a, b, { direction: normalizeDirection(order as OrderByDirectionType) as 1 | -1 }));
      // Realizamos la llamada al callback.
      if (complex) { complex.callback(complex.host); }
      return sorted;
    }
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
        return { [sanitizePropertyName(table)]: this.normalizeProperty(direction + columns.join(',')) };

      } else if (prop.includes('.')) {
        // Ej: 'cliente?.user?.email'
        const { table, columns, direction } = ApiEntity.splitTableAndFields(prop);
        return { [sanitizePropertyName(table)]: this.normalizeProperty(direction + columns.join('.')) };

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
          return { [sanitizePropertyName(p)]: this.normalizeProperty(prop[p]) };
        }
      }
    }
    // Desestructuramos el valor.
    let [propName, propDirection] = prop;
    // Pasamos de '-field' a ['field', 'desc']
    if (propName[0] === '-') { [propName, propDirection] = [propName.substring(1), 'desc']; }
    // Pasamos de ['field', 'desc'] a '-field'
    if (debug) { console.log(`normalizeProperty finally => `, { propName, propDirection }); }
    return (normalizeDirection(propDirection) === -1 ? '-' : '') + propName;
  }

  /** Obtiene el valor primitivo resolviendo el árbol de propiedades del objeto. */
  private resolvePropertyValue(value: any, prop: any): any {
    if (!value) { return undefined; }
    // Ej: value = { precio: 5.5, tarifa: { descripcion: 'T-1' } }
    if (typeof prop === 'string') {
      // Ej: prop = 'precio'
      return value[sanitizePropertyName(prop)];

    } else if (typeof prop === 'object') {
      // Ej: prop = { tarifa: 'descripcion' }
      for (const p in prop) {
        // Ej: p = 'tarifa'v
        if (prop.hasOwnProperty(sanitizePropertyName(p))) {
          const sp = sanitizePropertyName(p);
          // Ej: value[tarifa] = { descripcion: 'T-1' }, prop[tarifa] = 'descripcion'
          return this.resolvePropertyValue(value[sp], prop[sp]);
        }
      }
      return undefined;

    } else {
      throw new Error(`Invalid type '${typeof prop}' of property for compare in OrderByPipe`);
    }
  }

  private compareProperties = (properties: any) => (a: any, b: any) => properties.map((prop: any) => {
    // let direction: 1|-1 = 1;
    const direction = resolveDirection(prop);
    const valueA = this.resolvePropertyValue(a, prop);
    const valueB = this.resolvePropertyValue(b, prop);
    if (valueA === undefined || valueB === undefined) { return 0; }
    // console.log('values => ', { valueA, valueB });
    return compareValues(valueA, valueB, { direction });
  }).reduce((p: any, n: any) => p ? p : n, 0)

}
