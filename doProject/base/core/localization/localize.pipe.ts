import { Pipe, PipeTransform } from '@angular/core';

import { LocalizationService } from './localization.service';
import { CurrencyOptions } from './localization.types';


export type LocalizationFunction = 'hour' | 'time' | 'shortDate' | 'longDate' | 'shortDateHour' | 'shortDateTime' | 'mediumDateHour' | 'mediumDateTime' | 'longDateHour' | 'longDateTime' | 'currency';

@Pipe({
  name: 'localize',
  pure: true,
})
export class LocalizePipe implements PipeTransform {

  constructor(
    public localize: LocalizationService,
  ) {}

  transform(value: string | number, format?: LocalizationFunction | string, options?: { meridiem?: boolean } | CurrencyOptions ): string {
    if (!options) { options = {}; }
    const functions = [ 'hour', 'time', 'shortDate', 'longDate', 'shortDateHour', 'shortDateTime', 'mediumDateHour', 'mediumDateTime', 'longDateHour', 'longDateTime', 'currency' ];
    if (functions.includes(format)) {
      if (format === 'currency') {
        return this.localize.currency(value, options as CurrencyOptions);
      } else {
        if (!value) { return ''; }
        const meridiem = (options as any).meridiem;
        if (meridiem === undefined) {
          return this.localize[format](value);
        } else {
          return this.localize[format](value, meridiem);
        }
      }
    } else {
      if (!value) { return ''; }
      return this.localize.localizedDateTime(value, format);
    }
  }

}
