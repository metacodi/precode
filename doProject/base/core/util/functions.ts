import { FormGroup } from '@angular/forms';


// ---------------------------------------------------------------------------------------------------
//  Validators
// ---------------------------------------------------------------------------------------------------

export function MatchValidator(g: FormGroup): any {
  const controls = Object.values(g.controls);
  if (controls.length < 2) { return null; }
  const ctrl1: any = controls[0];
  const ctrl2: any = controls[1];
  if (ctrl1.value || ctrl2.value) {
    return ctrl1.value === ctrl2.value ? null : { mismatch: true };
  } else {
    return null;
  }
}

export function DifferentValidator(g: FormGroup): any {
  const controls = Object.values(g.controls);
  if (controls.length < 2) { return null; }
  const ctrl1: any = controls[0];
  const ctrl2: any = controls[1];
  if (ctrl1.value || ctrl2.value) {
    return ctrl1.value === ctrl2.value ? { samematch: true } : null;
  } else {
    return null;
  }
}

export function compareValues(a: any, b: any, options?: { direction?: 1|-1, sensitive?: boolean }): number {
  const debug = false;
  if (!options) { options = {}; }
  if (options.direction === undefined) { options.direction = 1; }
  if (options.sensitive === undefined) { options.sensitive = false; }
  // Comprobamos el tipo de datos.
  if (typeof a === 'string' && typeof b === 'string') {
    // Discernimos entre mayúsculas y minúsculas?
    if (!options.sensitive) {
      // Reducimos para case insensitive.
      // TODO: invest iso codes for locales.
      a = a.toLocaleLowerCase();
      b = b.toLocaleLowerCase();
      // a = a.toLowerCase();
      // b = b.toLowerCase();
    }
    // return a.localeCompare(b) ? options.direction : -(options.direction);
    if (debug) { console.log(`typeof a === 'string' && typeof b === 'string'`, { a, b, dir: a > b ? options.direction : a < b ? -(options.direction) : 0 }); }
    return a > b ? options.direction : a < b ? -(options.direction) : 0;

  } else if (typeof a === 'number' && typeof b === 'number') {
    if (debug) { console.log(`typeof a === 'number' && typeof b === 'number'`, { a, b, dir: a - b > 0 ? options.direction : a - b < 0 ? -(options.direction) : 0 }); }
    return a - b > 0 ? options.direction : a - b < 0 ? -(options.direction) : 0;

  } else {
    if (debug) { console.log(`!a && !!b`, { a, b, '!a && !!b': !a && !!b ? true : false, '!!a && !b': !!a && !b ? true : false, dir: (!a && !!b) ? options.direction : (!!a && !b) ? -options.direction : 0 }); }
    if (!a && !!b) { return -options.direction; }
    if (!!a && !b) { return options.direction; }
    return 0;
  }
}


// ---------------------------------------------------------------------------------------------------
//  translate
// ---------------------------------------------------------------------------------------------------

export function resolveTranslate(str: string | object, concat?: string): string {
  if (concat === undefined) { concat = ' '; }
  if (typeof str === 'object') { str = Object.keys(str).map(k => str[k]).join(concat); }
  return str;
}


// ---------------------------------------------------------------------------------------------------
//  focus
// ---------------------------------------------------------------------------------------------------

export function focus(elementRef: any): void {
  // Buscamos el elemento nativo del DOM y su función 'focus' o 'setFocus'
  if (elementRef && elementRef.nativeElement && typeof elementRef.nativeElement.focus === 'function') { elementRef.nativeElement.focus(); }
  if (elementRef && elementRef.nativeElement && typeof elementRef.nativeElement.setFocus === 'function') { elementRef.nativeElement.setFocus(); }
  if (elementRef && elementRef.el && typeof elementRef.el.focus === 'function') { elementRef.el.focus(); }
  if (elementRef && elementRef.el && typeof elementRef.el.setFocus === 'function') { elementRef.el.setFocus(); }
  // Si hemos pasado el elemento nativo directamente a la función.
  if (elementRef && typeof elementRef.focus === 'function') { elementRef.focus(); }
  if (elementRef && typeof elementRef.setFocus === 'function') { elementRef.setFocus(); }
}


// ---------------------------------------------------------------------------------------------------
//  resolvers
// ---------------------------------------------------------------------------------------------------

export function resolveComponentFactory(component: any, options?: { componentName?: string }): Promise<any> {
  return new Promise<any>((resolve: any, reject: any) => {
    if (typeof component === 'string') {
      if (options === undefined) { options = {}; }
      if (options.componentName === undefined) { options.componentName = ''; }
      // import('src/' + component).then(module => {
      //   Object.getOwnPropertyNames(module).map(prop => {
      //     const descriptor = Object.getOwnPropertyDescriptor(module, prop);
      //     if (options.componentName) {
      //       if (options.componentName === prop) {
      //         resolve(descriptor.get());
      //       }
      //     } else if (descriptor.enumerable && typeof descriptor.get === 'function') {
      //       resolve(descriptor.get());
      //     }
      //   });
      // }).catch(error => reject(error));
      reject(new Error('No se admite la carga dinámica de componentes. Suministre una referencia a la definción de clase en su lugar obtenida como una importación del componente.'));

    } else if (typeof component === 'function') {
      resolve(component);

    } else {
      reject(new Error(`No se reconoce el tipo de componente: '${typeof component}'. Suministre una referencia a la definción de clase en su lugar obtenida como una importación del componente.`));
    }
  });
}


// ---------------------------------------------------------------------------------------------------
//  breakpoints
// ---------------------------------------------------------------------------------------------------

/** Realiza un media query para conocer cuando se ha producido un punto de ruptura en el tamaño del dispositivo.  */
export function isBreakpoint(size: string, direction?: 'up' | 'down' | 'min-width' | 'max-width') {
  if (!size) { return false; }
  if (size === 'sm') { size = '576px'; }
  if (size === 'md') { size = '768px'; }
  if (size === 'lg') { size = '992px'; }
  if (size === 'xl') { size = '1200px'; }
  if (!direction) { direction = 'up'; }
  if (direction === 'up') { direction = 'min-width'; }
  if (direction === 'down') { direction = 'max-width'; }
  return window.matchMedia(`(${direction}: ${size})`).matches;
}
