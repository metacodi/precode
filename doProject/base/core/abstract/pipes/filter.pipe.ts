import { Pipe, PipeTransform } from '@angular/core';
import { Subject } from 'rxjs';

import { ApiEntity, ConcatOperatorType } from 'src/core/api';
import { deepAssign, matchWords } from 'src/core/util';

import { FilterTypeComplex, FilterType } from '../model/entity-schema';


@Pipe({
    name: 'filter',
    pure: false
})
export class FilterPipe implements PipeTransform {
  private debug = false;

  static isComplex(filter: any): boolean {
    return typeof filter === 'object' && !Array.isArray(filter) && filter.hasOwnProperty('pipe');
  }

  transform(rows: any[], match: string, filter?: FilterType, options?: { ignoreChecked?: boolean, concat?: ConcatOperatorType }): any[] {
    // Si no hay elementos, no hay nada que filtrar...
    if (!rows) { return rows; }
    if (!Array.isArray(rows)) { return rows; }
    if (!options) { options = {}; }
    if (options.ignoreChecked === undefined) { options.ignoreChecked = true; }
    if (this.debug) { console.log('FilterPipe => ', { rows, match, filter }); }
    // Obtenemos una referencia del filtro complejo si es posible.
    const complex = FilterPipe.isComplex(filter) ? filter as FilterTypeComplex : undefined;

    // Comprobamos si es un filtro complejo.
    if (FilterPipe.isComplex(filter)) {
      // Comprobamos si hay que generar una consulta en el backend o hay que aplicar el filtro a las filas del frontend.
      const filterRequired: boolean | 'local' = complex.host.pipeToBackendRequired(match);
      if (filterRequired === true) {
        // Generamos una consulta al backend.
        (complex.host.pipeFilterToBackend(match));
        // (complex.host.pipeFilterChanged as Subject<string>).next(match);
        return rows;

      } else {
        // Solo filtramos si no se ha hecho ya desde backend.
        if (!complex.pipeToBackend || filterRequired === 'local') {
          // Filtramos la lista aplicando la función de filtro.
          // return rows.filter(row => this.applyFilter(row, match, filter, options));
          const filtered = rows.filter(row => {
            const pass = this.applyFilter(row, match, filter, options);
            return pass;
          });
          if (this.debug) { console.log(this.constructor.name + '.transform() -> filtered =>', filtered); }
          return filtered;

        } else {
          // Si no hay ninguna cadena de filtro, comprobamos si existe una función de pre-filtro...
          if (typeof complex.preFilter === 'function') {
            // Filtramos la lista aplicando la función de pre-filtro.
            return rows.filter(row => complex.preFilter(row, complex.host));
          }
          // Si no existe un pre-filtro, devolvemos todos los elementos.
          return rows;
        }
      }
    } else {
      // Si no es complejo entonces filter es de tipo `string | string[]`.
      return rows.filter(row => this.applyFilter(row, match, filter, options));
    }
  }

  applyFilter(row: any, match: string, filter?: FilterType, options?: { ignoreChecked?: boolean, concat?: ConcatOperatorType }): boolean {
    if (!options) { options = {}; }
    if (options.ignoreChecked === undefined) { options.ignoreChecked = true; }
    if (options.concat === undefined) { options.concat = 'AND'; }
    if (this.debug) { console.log('applyFilter', { row, match, filter, options }); }
    // Si está chequeado siempre debe mostarse.
    if (!!row?.checked && !!options.ignoreChecked) { return true; }
    // Obtenemos una referencia del filtro complejo si es posible.
    const complex = FilterPipe.isComplex(filter) ? filter as FilterTypeComplex : undefined;
    // Si se ha establecido una función para pre-filtrar...
    if (!!complex && typeof complex.preFilter === 'function') {
      // Si el item no pasa el filtro lo descartamos.
      if (!complex.preFilter(row, complex.host)) { return false; }
    }
    // Si no hay cadena de búsqueda, aceptamos todos los items que hayan superado el pre-filtro.
    if (!match) { return true; }

    // Aplicamos el filtro según el concatenador.
    return this[`applyFilter${complex?.concatPipeWords || options.concat}`](row, match, filter);
  }

  protected applyFilterAND(row: any, match: string, filter?: FilterType, options?: { splitWords?: boolean, ignoreCase?: boolean, ignoreAccents?: boolean }): boolean {
    if (!options) { options = {}; }
    if (options.splitWords === undefined) { options.splitWords = true; }
    if (options.ignoreCase === undefined) { options.ignoreCase = true; }
    if (options.ignoreAccents === undefined) { options.ignoreAccents = true; }

    // Obtenemos una referencia del filtro complejo si es posible.
    const complex = FilterPipe.isComplex(filter) ? filter as FilterTypeComplex : undefined;
    // Obtenemos la modalidad establecida para la comparación de mayúsuclas y minúsculas.
    const splitWords = complex?.splitPipeWords !== undefined ? complex.splitPipeWords : options.splitWords;
    const ignoreCase = complex?.ignoreCase !== undefined ? complex.ignoreCase : options.ignoreCase;
    const ignoreAccents = complex?.ignoreAccents !== undefined ? complex.ignoreAccents : options.ignoreAccents;
    // Separamos las palabras escritas y eliminamos los signos de puntuación.
    const words = splitWords ? matchWords(match) : [match];

    // Cada palabra debe estar en alguno de los campos.
    return words.every(word => this.applyFilterOR(row, word, filter, { splitWords, ignoreCase, ignoreAccents }));
  }

  protected applyFilterOR(row: any, match: string, filter?: FilterType, options?: { splitWords?: boolean, ignoreCase?: boolean, ignoreAccents?: boolean }): boolean {
    if (!options) { options = {}; }
    if (options.splitWords === undefined) { options.splitWords = true; }
    if (options.ignoreCase === undefined) { options.ignoreCase = true; }
    if (options.ignoreAccents === undefined) { options.ignoreAccents = true; }

    // Obtenemos una referencia del filtro complejo si es posible.
    const complex = FilterPipe.isComplex(filter) ? filter as FilterTypeComplex : undefined;
    // Obtenemos los campos sobre los que buscar la cadena de filtro.
    let fields: string | string[] = complex ? complex.pipe : filter as string | string[];
    // Si no se indican los campos en los que buscar, entonces tomamos todas las propiedades del objeto.
    if (!fields || !fields.length) { fields = Object.keys(row); }
    // Nos aseguramos que se trata de un array.
    if (typeof fields === 'string') { fields = ApiEntity.splitFields(fields); }
    // Obtenemos la modalidad establecida para la comparación de mayúsuclas y minúsculas.
    const splitWords = complex?.splitPipeWords !== undefined ? complex.splitPipeWords : options.splitWords;
    const ignoreCase = complex?.ignoreCase !== undefined ? complex.ignoreCase : options.ignoreCase;
    const ignoreAccents = complex?.ignoreAccents !== undefined ? complex.ignoreAccents : options.ignoreAccents;
    // Separamos las palabras escritas y eliminamos los signos de puntuación.
    const words = splitWords ? matchWords(match) : [match];

    for (const prop of fields) {
      // Comprobamos la declaración del campo.
      if (prop.includes('(') || prop.includes('.')) {
        // Ej: 'user(nombre,apellidos)' | 'cliente?.user?.nombre'
        const { table, columns, optional } = ApiEntity.splitTableAndFields(prop);
        if (this.debug) { console.log('applyFilter => prop is includes "(" or "." -> ', {prop, table, columns}); }
        // Comprobamos que la propiedad existe en la fila.
        if (!optional && row && !row.hasOwnProperty(table)) { throw new Error(`No se ha encontrado la propiedad '${table}' en la fila filtrada.`); }
        // Comprobamos que tenga un valor válido para ser comparado.
        if (Array.isArray(row[table])) {
          // Comprobamos que almenos uno de los hijos cumple.
          const result = (row[table] as any[]).some(child => this.applyFilterOR(child, match, columns, { splitWords, ignoreCase, ignoreAccents }));
          // Si la respuesta a la llamada recursiva ha encontrado una coincidencia salimos, sino seguimos buscando.
          if (result) { return true; }

        } else if (row[table]) {
          // Llamada recursiva.
          const result = this.applyFilterOR(row[table], match, columns, { splitWords, ignoreCase, ignoreAccents });
          // Si la respuesta a la llamada recursiva ha encontrado una coincidencia salimos, sino seguimos buscando.
          if (result) { return true; }
        }

      } else if (row[prop] === null) {
        // No hacemos nada, seguimos buscando.
        if (this.debug) { console.log('applyFilter => prop is null or undefined -> ', {prop, row}); }

      } else if (Array.isArray(row[prop])) {
        if (this.debug) { console.warn(this.constructor.name + '.applyFilterOR() is Array ¿?', { match, prop, 'row[prop]': row[prop], fields, row, filter, options }); }
        // Comprobamos que almenos uno de los hijos cumple.
        const result = (row[prop] as any[]).some(child => this.applyFilterOR(child, match, Object.keys(child), { splitWords, ignoreCase, ignoreAccents }));
        // Si la respuesta a la llamada recursiva ha encontrado una coincidencia salimos, sino seguimos buscando.
        if (result) { return true; }

      } else if (typeof row[prop] === 'object') {
        if (this.debug) { console.warn(this.constructor.name + '.applyFilterOR() is object ¿?', { match, prop, 'row[prop]': row[prop], fields, row, filter, options }); }
        // Llamada recursiva.
        const result = this.applyFilterOR(row[prop], match, Object.keys(row[prop]), { splitWords, ignoreCase, ignoreAccents });
        // Si la respuesta a la llamada recursiva ha encontrado una coincidencia salimos, sino seguimos buscando.
        if (result) { return true; }

      } else {
        const optional = prop.endsWith('?');
        const property = optional ? prop.slice(0, -1) : prop;
        // Comprobamos que la propiedad existe en la fila.
        if (!optional && row && !row.hasOwnProperty(property)) { throw new Error(`No se ha encontrado la propiedad '${property}' en la fila filtrada.`); }
        // Filtramos la propiedad en busca de coincidencias.
        if (this.filterProperty(row[property], match, { splitWords, ignoreCase, ignoreAccents, words })) { return true; }
      }
    }
    // Ninguna coincidencia, no pasa el filtro y será excluído de los resutados.
    return false;
  }

  filterProperty(value: any, match: string, options?: { splitWords?: boolean, ignoreCase?: boolean, ignoreAccents?: boolean, words?: string[] }): boolean {
    if (!value || !match) { return false; }
    // Ej: if (value.search(new RegExp(match, "i")) == -1)
    if (typeof value === 'string' || typeof value === 'number') {
      if (!options) { options = {}; }
      if (options.splitWords === undefined) { options.splitWords = true; }
      if (options.ignoreCase === undefined) { options.ignoreCase = true; }
      if (options.ignoreAccents === undefined) { options.ignoreAccents = true; }
      // Normalizamos el texto cuando hay que ignorar los acentos.
      // NOTA: La función `String.normalize()` solo es compatible con navegadores que soportan `ECMAScript v.6`
      const text: string = options.ignoreAccents ? String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '') : String(value);
      const flags = options.ignoreCase ? 'i' : '';

      // A la primera coincidencia lo filtramos como válido (true).
      if (!options.splitWords) {
        if ((new RegExp(match, flags)).test(text)) { return true; }

      } else {
        if (options.words === undefined) { options.words = matchWords(match); }
        if (options.words.some(w => (new RegExp(w, flags)).test(text))) { return true; }
      }
    }
    return false;
  }

}
