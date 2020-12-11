import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';


@Pipe({
  name: 'trustHtml'
})
export class TrustHtmlPipe implements PipeTransform {

  constructor(
    // DomSanitizer helps preventing Cross Site Scripting Security bugs (XSS)
    // by sanitizing values to be safe to use in the different DOM contexts.
    public sanitizer: DomSanitizer,
  ) { }

  transform(value: any): any {
    // Calling any of the bypassSecurityTrust... APIs disables Angular's built-in sanitization for the value passed in.
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

