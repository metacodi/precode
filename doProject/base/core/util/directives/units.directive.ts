import { Input, Directive, ElementRef, Renderer2, HostListener, forwardRef, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';

import { NumberFormat } from '../ts-utils';


/**
 * The `ControlValueAccessor` for writing a number value with units and listening to number input changes.
 * The value accessor is used by the `FormControlDirective`, `FormControlName`, and  `NgModel` directives.
 *
 * **Usage**
 *
 * @default `€:2:sufix:right`: symbol `€`, `2` decimals., put symbol after value `sufix`, input alignment `right`.
 * ```html
 * <ion-input [units]="€:2:sufix:right">
 * ```
 *
 * Decimals expressed as a mask that depends on the precision where `0` indicates mandatory decimal and `#` indicates optional decimal.
 * ```html
 * <ion-input [units]="kg:'00#'">
 * ```
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[units]',
  // selector: 'input[units][formControlName],input[units][formControl],input[units][ngModel]',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => UnitsDirective),
    multi: true
  }],
  // host: {
  //   '(change)': 'onChange($event.target.value)',
  //      '(input)': 'onChange($event.target.value)',
  //      '(blur)': 'onTouched()'
  // },
})
export class UnitsDirective implements OnInit, OnDestroy, ControlValueAccessor {
// export class UnitsDirective implements OnInit {
  private debug = true;

  private decimalSep = (0.5).toLocaleString().replace('0', '').replace('5', '');
  private groupSep = (this.decimalSep === ',' ? '.' : ',');
  // private symbol: string = ''
  private mask = '';

  @Input() units: string;
  @Input() formControlUnits: FormControl;
  @Input() position = 'sufix';
  @Input() decimals: any = 2;
  @Input() alignment = 'right';
  @Input() symbol = '';

  subscription: Subscription;

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(
    public elRef: ElementRef,
    // public control: NgControl,
    // @Self() public control: NgControl,
    public renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    // Referenciamos el elemento nativo.
    const element = this.elRef.nativeElement;

    // // Monitorizamos los cambios de valor.
    // this.control.valueChanges.subscribe(observer => {
    //   if (this.debug) { console.log(this.constructor.name + '.ngControl.valueChanges.subscribe(observer) => ', { ngControl: this.control, observer: observer } ); }
    // })
    this.subscription = this.formControlUnits.valueChanges.subscribe((v) => {
      if (this.onChange) { this.writeValue(v); }
    });

    // Obtenemos la configuración actual.
    if (this.units) {
      const parts = this.units.split(':');
      if (parts.length > 0) { this.symbol = parts[0]; }
      if (parts.length > 1 && !Number.isNaN(+parts[1])) { this.decimals = +parts[1]; }
      // El resto son palabras identificables, así que nos da igual el orden de aparición:
      for (let i = 2; i < parts.length; i++) {
        const value = parts[i];
        if (value === 'prefix' || value === 'sufix') { this.position = value; }
        if (value === 'left' || value === 'center' || value === 'right') { this.alignment = value; }
      }
    }

    if (typeof this.decimals === 'string' && this.decimals[0] === '\'' && this.decimals[this.decimals.length - 1] === '\'') {
        this.decimals = this.decimals.substring(1, this.decimals.length - 1);
        this.mask = this.decimals;
        this.decimals = this.mask.length;
    } else {
        this.decimals = +this.decimals;
        this.mask = new Array(this.decimals + 1).join('0');
    }

    // Establecemos la alineación del control.
    element.style.textAlign = this.alignment;
    if (this.alignment === 'right') { element.style.paddingRight = '16px'; }

    if (this.debug) { console.log(this.constructor.name + '.ngOnInit(config): ', { el: this.elRef, units: this.units, decimalSep: this.decimalSep, groupSep: this.groupSep, mask: this.mask, decimals: this.decimals, position: this.position, alignment: this.alignment, symbol: this.symbol }); }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
   }

  // ---------------------------------------------------------------------------------------------------
  //  ControlValueAccessor
  // ---------------------------------------------------------------------------------------------------

  // registerOnChange(fn: any): void {
  //   if (this.debug) { console.log(this.constructor.name + '.registerOnChange(fn) => ', fn); }
  //   // The onChange method is the equivalent of AngularJS $parsers: view => model.
  //   this.onChange = (value: any) => {
  //     // Obtenemos el valor parseado para el modelo.
  //     const parsed = this.parseViewValue(value);
  //     if (this.debug) { console.log(this.constructor.name + '.registerOnChange(fn) -> onChange() => ', {value, parsed}); }
  //     // Pasamos el valor a la función para que actualice el modelo.
  //     fn(value === '' ? null : parsed);
  //   };
  // }

  registerOnChange(fn: any){
    if (this.debug) { console.log(this.constructor.name + '.registerOnChange(fn) => ', fn); }
    this.onChange = fn;
  }

  registerOnTouched(fn: any){
    if (this.debug) { console.log(this.constructor.name + '.registerOnTouched(fn) => ', fn); }
    this.onTouch = fn;
  }

  // registerOnTouched(fn: () => void): void {
  //   if (this.debug) { console.log(this.constructor.name + '.registerOnTouched(fn) => ', fn); }
  //   this.onTouched = fn;
  //   this.onChange = fn;
  // }

 //  setDisabledState(isDisabled: boolean): void {
 //    if (this.debug) { console.log(this.constructor.name + '.setDisabledState(isDisabled) => ', isDisabled); }
 //    this.renderer.setProperty(this.elRef.nativeElement, 'disabled', isDisabled);
 // }


  // ---------------------------------------------------------------------------------------------------
  //  Listeners => keydown . keyup . focusin . focusout
  // ---------------------------------------------------------------------------------------------------

  // Al esribir intercambiamos el punto por la coma (separador decimal) y evitamos que se entre dos veces el separador decimal.
  @HostListener('keydown', ['$event', '$event.target']) keydown(ev: KeyboardEvent, el: HTMLElement): void {
    // if (this.debug) { console.log(this.constructor.name + '.keydown(ev, el) => ', { view_value: (el as any).value }); }
    // Evaluamos la tecla pulsada...
    switch (ev.key) {
      case ',':
      case '.':
        // Obtenemos el valor no seleccionado.
        const unselect = this.unselectedValue(el);
        // Evitamos que escriba dos veces el separador decimal.
        if (unselect.includes(this.decimalSep) || unselect.includes(this.groupSep)) { ev.preventDefault(); }
    }
  }

  // Al esribir intercambiamos el punto por la coma (separador decimal) y evitamos que se entre dos veces el separador decimal.
  @HostListener('keyup', ['$event', '$event.target']) keyup(ev: KeyboardEvent, el: HTMLElement): void {
    // if (this.debug) { console.log(this.constructor.name + '.keyup(ev, el) => ', { view_value: (el as any).value, model_value: this.control.value}); }
    // if (this.debug) { console.log(this.constructor.name + '.keyup(ev, el) => ', { view_value: (el as any).value }); }
    // if (this.debug) { console.log({HTMLElement: el, ElementRef: this.elRef, nativeElement: this.elRef.nativeElement }); }
    if (this.decimalSep === ',') {
      // Obtenemos el valor actual de la vista
      let value = (el as any).value;
      // Evaluamos la tecla pulsada...
      switch (ev.key) {
        case ',':
          // Evitamos que escriba dos veces el separador decimal.
          if (this.unselectedValue(el).includes(this.decimalSep)) { ev.preventDefault(); }
          break;

        case '.':
          // Referenciamos el elemento nativo.
          const element = this.elRef.nativeElement;
          // Conservamos la selección.
          let start = 0; if (typeof (el as any).selectionStart !== 'undefined') { start = (el as any).selectionStart; }
          let end = 0; if (typeof (el as any).selectionEnd !== 'undefined') { end = (el as any).selectionEnd; }
          // Comprobamos si ya contiene el separador decimal.
          if (this.unselectedValue(el).includes(this.decimalSep)) {
            // if (this.debug) { console.log('value.includes => ', value); }
            // Cancelamos la propagación del evento.
            ev.preventDefault();

          } else {
            // if (this.debug) { console.log('!value.includes => ', value);  }
            // Reemplazamos el punto decimal por la coma.
            value = value.toString().split(this.groupSep).join(this.decimalSep);
            // if (this.debug) { console.log('!value.includes replaced => ', value);  }
            // Establecemos el nuevo valor directamente en el elemento.
            (el as any).value = value;
            // Restablecemos la selección.
            if (typeof element.setSelectionRange === 'function') { element.setSelectionRange(start, end); }
          }
      }
    }
  }

  // @HostListener('keypress', ['$event', '$event.target']) keypress(ev: KeyboardEvent, el: HTMLElement): void {
  //   if (this.debug) { console.log(this.constructor.name + '.keypress(ev, el) => ', { view_value: (el as any).value }); }
  //   // Establecemos el valor para el elemento de la vista.
  //   const value = (el as any).value;
  //   this.writeValue(this.parseViewValue(value));
  //   this.onTouch();
  // }


  private unselectedValue(el: any): string {
    // Obtenemos el valor del elemento HTML
    const value = (el as any).value;
    // Si no hay valor devolvemos una cadena vacía.
    if (!value) { return ''; }
    // Obtenemos los límites de la selección.
    let start = 0; if (typeof el.selectionStart !== 'undefined') { start = el.selectionStart; }
    let end = 0; if (typeof el.selectionEnd !== 'undefined') { end = el.selectionEnd; }
    // Obtenemos la parte del valor que no forma parte de la selección actual.
    let unselected = '';
    for (let i = 0; i < value.length; i++) {
      if (i < start || i >= end) {
        unselected += value[i];
      }
      // if (this.debug) { console.log({ i: i, char: value[i], unselected: unselected, start: start, end: end, 'i < start': i < start, 'i >= end': i >= end, 'i < start || i >= end': i < start || i >= end }); }
    }
    return unselected;
  }

  // Al entrar eliminamos los separadores de millar.
  @HostListener('focusin', ['$event', '$event.target']) focusin(ev: FocusEvent, el: HTMLElement): void {
    // if (this.debug) { console.log(this.constructor.name + '.focusin(ev, el) => ', { view_value: (el as any).value, model_value: this.control.value, }); }
    if (this.debug) { console.log(this.constructor.name + '.focusin(ev, el) => ', { el, view_value: (el as any).value }); }
    // Obtenemos el valor actual en el elemento del template.
    let value = (el as any).value;
    // Comprobamos que sea un valor numérico.
    if (typeof value === 'undefined' || Number.isNaN(value)) {
      // Establecemos un valor vacía en el elemento del template.
      (el as any).value = '';

    } else {
      // if (this.debug) { console.log('focusin value = ', value); }
      // Obtenemos el valor para la vista.
      value = this.parseViewValue(value);
      // if (this.debug) { console.log('focusin this.parseViewValue(value) = ', value); }
      // Reemplazamos el separador decimal.
      if (value && this.decimalSep === ',') { value = value.toString().replace(this.groupSep, this.decimalSep); }

      // if (this.debug) { console.log('focusin final = ', value);  }

      // Establecemos el valor para el elemento del template.
      (el as any).value = value;
      // Seleccionamos todo el contenido.
      if (typeof (el as any).select === 'function') { (el as any).select(); }
    }
  }

  // Al entrar eliminamos los separadores de millar.
  @HostListener('change', ['$event', '$event.target']) changed(ev: FocusEvent, el: HTMLElement): void {
    if (this.debug) { console.log(this.constructor.name + '.changed(ev, el) => ', { ev, el }); }
  }
  @HostListener('focusout', ['$event', '$event.target']) focusout(ev: FocusEvent, el: HTMLElement): void {
    if (this.debug) { console.log(this.constructor.name + '.focusout(ev, el) => ', { view_value: (el as any).value }); }
    // Obtenemos el valor actual de la vista
    const value = (el as any).value;
    // Establecemos el valor en el modelo a través del controlador de acceso.
    this.onChange(value);
    // Establecemos el valor para el elemento de la vista.
    this.writeValue(this.parseViewValue(value));
    this.onTouch();
  }

  // The writeValue method is the equivalent of AngularJS $formatters: model => view.
  writeValue(value: any): void {
    const normalizedValue = value === null ? '' : value;
    // Obtenemos el valor formateado para el template.
    const formatted = this.formatModelValue(normalizedValue);
    if (this.debug) { console.log(this.constructor.name + '.writeValue(value) => ', { value, normalizedValue, formatted }); }
    // Establecemos el valor formateado en el elemento del template.
    this.renderer.setProperty(this.elRef.nativeElement, 'value', formatted);
  }

  private parseViewValue(viewValue: any): any {
    if (viewValue === null) {
      if (this.debug) { console.log(this.constructor.name + '.parseViewValue() =>', { viewValue, parsed: null }); }
      return null;
    }
    // Obtenemos el valor.
    let value = viewValue.toString();
    // Establecemos el separador decimal para el parseo.
    if (this.decimalSep === ',') { value = value.split(this.groupSep).join('').replace(this.decimalSep, this.groupSep); }
    // Elminamos el símbolo y los espacios en blanco.
    value = value.trim(this.symbol).trim(' ');
    // Parseamos el número.
    let parsed = parseFloat(parseFloat(value).toFixed(this.decimals));
    if (Number.isNaN(parsed)) { parsed = null; }
    // Establecemos el valor en el formulario.
    if (this.formControlUnits) {
      this.formControlUnits.setValue(parsed, { emitModelToViewChange: true });
      this.formControlUnits.updateValueAndValidity();
    }

    if (this.debug) { console.log(this.constructor.name + '.parseViewValue() => ', { viewValue, parsed }); }
    return parsed;
  }

  private formatModelValue(modelValue): string {
    if (typeof modelValue === 'undefined' || Number.isNaN(modelValue)) {
      if (this.debug) { console.log(this.constructor.name + '.formatModelValue() =>', { modelValue, formatted: '' }); }
      return '';
    }
    const parsedValue: any = parseFloat(modelValue);
    if (Number.isNaN(parsedValue)) {
      if (this.debug) { console.log(this.constructor.name + '.formatModelValue() =>', { modelValue, formatted: '' }); }
      return '';
    }
    const value = NumberFormat(parsedValue, this.mask, this.decimalSep);
    // if (this.debug) { console.log('formatModelValue: ', value);; }
    const formatted = (this.position === 'prefix' ? this.symbol : '') + value + (this.position === 'sufix' ? ' ' + this.symbol : '');
    if (this.debug) { console.log(this.constructor.name + '.formatModelValue() =>', { modelValue, formatted }); }
    return formatted;
  }

}
