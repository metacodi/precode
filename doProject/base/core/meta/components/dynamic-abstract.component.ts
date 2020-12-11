import { Injector, Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { evalExpr } from 'src/core/util';

import { FieldType, stringOrExpr, booleanOrExpr, numberOrExpr } from '../model/meta-types';


/**
 * Componente base del que se heredan todos los componentes dinámicos.
 */
export abstract class DynamicAbstractComponent  {

  frm: FormGroup;
  host: any;

  /**
   * Instance of the translation service, the internationalization library (i18n) for Angular of the package `@ngx-translate`.
   * @category Dependencies
   */
  translate: TranslateService;

  constructor(protected injector: Injector) {
    /** @category Dependencies */
    this.translate = this.injector.get<TranslateService>(TranslateService);
  }


  // ---------------------------------------------------------------------------------------------------
  //  size
  // ---------------------------------------------------------------------------------------------------

  size(field: FieldType, breakpoint?: string): number | undefined {
    if (!field.component.size) { return undefined; }
    breakpoint = breakpoint || 'xs';
    return typeof field.component.size === 'object' ? field.component.size[breakpoint] : field.component.size || undefined;
  }


  // ---------------------------------------------------------------------------------------------------
  //  visible . disabled
  // ---------------------------------------------------------------------------------------------------

  visible(expr: boolean | string, $event?: any): boolean {
    // Por defecto lo dejamos visible.
    if (!expr) { return true; }
    // Evaluamos la expresión suministrada.
    return typeof expr === 'boolean' ? expr : !!this.evalExpr(expr, { $event });
  }

  disabled(expr: boolean | string, $event?: any): boolean {
    // Por defecto lo dejamos habilitado.
    if (!expr) { return false; }
    // Evaluamos la expresión suministrada.
    return typeof expr === 'boolean' ? expr : !!this.evalExpr(expr, { $event });
  }


  // ---------------------------------------------------------------------------------------------------
  //  eval
  // ---------------------------------------------------------------------------------------------------

  evalEvent(expr: string, $event: any): any {
    // Evaluamos el código de la expresión.
    return this.evalExpr(expr, { $event });
  }

  evalOrExpr(value: stringOrExpr | booleanOrExpr | numberOrExpr): string | boolean | number | undefined {
    if (!value) { return (value as any); }
    return typeof value === 'object' && value.hasOwnProperty('expr') ? this.evalExpr(value.expr) : value;
  }

  evalOrExprAndTr(value: stringOrExpr | booleanOrExpr | numberOrExpr, defaultValue?: any): string | boolean | number | undefined {
    if (value === undefined) { return defaultValue; }
    value = typeof value === 'object' && value.hasOwnProperty('expr') ? this.evalExpr(value.expr) : value;
    if (!value) { return defaultValue; }
    return this.translate.instant(value as string);
  }

  evalExpr(expr: string, args?: { [key: string]: any }): any {
    // Evaluamos el código de la expresión.
    return evalExpr(expr, { args, host: this.host });
  }

}
