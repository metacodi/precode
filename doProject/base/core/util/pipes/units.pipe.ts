import { Pipe, PipeTransform } from '@angular/core';

import { NumberFormat } from '../ts-utils';


/**
 * A pipe to format numbers with a symbol that represents the unitst of the current magnitude.
 *
 * **Usage**
 *
 * ```
 * {{ factura.total | units }}
 * ```
 * @default `€:2:sufix:right`: symbol `€`, `2` decimals., put symbol after value `sufix`, input alignment `right`.
 * ```
 * {{ factura.total | units:'€':2:'sufix' }}
 * ```
 *
 * Decimals expressed as a mask that depends on the precision where `0` indicates mandatory decimal and `#` indicates optional decimal.
 * ```html
 * {{ factura.total | units="kg:'00#' }}
 * ```
 */
@Pipe({
  name: 'units'
})
export class UnitsPipe implements PipeTransform {

  transform(input: any, currency: string, decimals: any, position: string): any {
    if (typeof decimals !== 'number') { decimals = decimals || 2; }
    currency = currency || ' €';
    position = position || 'sufix';

    let mask = '';
    if (typeof decimals === 'string') {
      if (decimals[0] === '\'' && decimals[decimals.length - 1] === '\'') { decimals = decimals.substring(1, decimals.length - 1); }
      mask = decimals; decimals = mask.length;
    } else {
      decimals = +decimals;
      mask = new Array(decimals + 1).join('0');
    }

    const decimalSep = (0.5).toLocaleString().replace('0', '').replace('5', '');
    const groupSep = (decimalSep === ',' ? '.' : ',');

    if (typeof input === 'undefined' || Number.isNaN(input)) { return ''; }

    const value = NumberFormat(parseFloat(input), mask, decimalSep);

    return (position === 'prefix' ? currency : '') + value + (position === 'sufix' ? currency : '');
  }

}
