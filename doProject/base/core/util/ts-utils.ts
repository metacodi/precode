// import ts from 'typescript';


// ---------------------------------------------------------------------------------------------------
//  Regex patterns
// ---------------------------------------------------------------------------------------------------

export const patterns = {
  int: '^[+-]?(0|[1-9]\d*)?$',
  intZeroOrPositive: /^[+]?(0|[1-9]\d*)?$/,
  float: '^[+-]?[0-9]*\.?[0-9]+$',
  floatZeroOrPositive: '^[+]?[0-9]*\.?[0-9]+$',
  punctuation: /[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g,
};

// ---------------------------------------------------------------------------------------------------
//  Format
// ---------------------------------------------------------------------------------------------------


export function round(value: number, decimals?: number): number {
  if (+decimals === 0) { return Math.round(value); }
  if (decimals === undefined) { decimals = 2; }

  value = +value;
  const exp = +decimals;

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) { return NaN; }

  const shift = Math.pow(10, exp);
  return Math.round(value * shift) / shift;
}

export function NumberRound(value: number, decimals: number): number {
  if (decimals === undefined || +decimals === 0) { return Math.round(value); }

  value = +value;
  const exp = +decimals;

  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) { return NaN; }

  // Shift
  let parts = value.toString().split('e');
  value = Math.round(+(parts[0] + 'e' + (parts[1] ? (+parts[1] + exp) : exp)));

  // Shift back
  parts = value.toString().split('e');
  return +(parts[0] + 'e' + (parts[1] ? (+parts[1] - exp) : -exp));
}

export function NumberFormat(value: number, d ?: any, c ?: any, s ?: any, x ?: any): string {
  /**
   * Number.prototype.format(n, x, s, c)
   *
   * @param integer d: length of decimal || decimals mask (ex: "0##" muestra almenos un decimal, y dos más si las otras cifras no son 0)
   * @param mixed   c: decimal delimiter
   * @param mixed   s: sections delimiter
   * @param integer x: length of whole part
   *
   * **Usage**
   * 12345678.9.format(2, ',', '.', 3); // "12.345.678,90"
   * 123456.789.format(4, ':', ' ', 4); // "12 3456:7890"
   * 12345678.9.format(0, '', '-', 3);  // "12-345-679"
   */
  if (d === undefined) { d = 0; }
  if (c === undefined) { c = (s !== undefined && s === ',' ? '.' : ','); }
  if (s === undefined) { s = (c !== undefined && c === '.' ? ',' : '.'); }
  if (x === undefined || x < 1) { x = 3; }
  let d1 = 0; let d2 = 0; let scope = 'd1';
  if (typeof d === 'string') {
    // for (let i = 0; i < d.length; i++) {
    for (const digit of d) {
      switch (digit) {
        case '0':
          if (scope === 'd2') { throw new Error(`Incorrect format '${d}'`); }
          d1 += 1; break;
        case '#':
          if (scope === 'd1') { scope = 'd2'; }
          d2 += 1; break;
        default: throw new Error(`Incorrect format '${d}'`);
      }
    }
    const nts = value.toString();  // Así trunca a los 16 decimales y el último lo redondea.
    if (nts.split('.').length === 2) {
      d = nts.split('.')[1].length;
    } else {
      d = 0;
    }
  }
  const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (d > 0 ? '\\D' : '$') + ')';
  let str: string;
  if (d1 + d2 > 0) {
    str = NumberRound(value, d1 + d2).toString(); // Así trunca a los 16 decimales y el último lo redondea.
  } else {
    // tslint:disable-next-line: no-bitwise
    str = value.toFixed(Math.max(0, ~ ~d));
  }
  const ns = (c ? str.replace('.', c) : str).replace(new RegExp(re, 'g'), '$&' + (s || ','));

  if (d1 + d2 === 0) { return ns; }
  const arr = ns.split(c);
  let dec = ''; if (arr.length === 2) { dec = arr[1]; }
  let res = '';
  let idx = 0;
  for (let i = 0; i < d1; i++) {
    if (idx < dec.length) { res += dec[idx]; } else { res += '0'; }
    idx += 1;
  }
  for (let i = 0; i < d2; i++) {
    if (idx < dec.length) { res += dec[idx]; }
    idx += 1;
  }
  return arr[0] + (res.length > 0 ? c : '') + res;
}

export function capitalize(s: any): string {
  if (typeof s !== 'string') { return ''; }
  if (s.length < 2) { return s.toUpperCase(); }
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function toLower(value: string): string {
  if (typeof value.toLocaleLowerCase === 'function') {
    return value.toLocaleLowerCase();
  } else if (typeof value.toLowerCase === 'function') {
    return value.toLowerCase();
  }
  return value;
}

export function getLocalISOString(): string {
  // Get local time as ISO string with offset at the end
  const now = new Date();
  const tzo = -now.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (n: any, width?: number) => {
    width = width || 2;
    n = Math.abs(Math.floor(n)) + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
  };
  return now.getFullYear()
    + '-' + pad(now.getMonth() + 1)
    + '-' + pad(now.getDate())
    + 'T' + pad(now.getHours())
    + ':' + pad(now.getMinutes())
    + ':' + pad(now.getSeconds())
    + '.' + pad(now.getMilliseconds(), 3)
    + dif + pad(tzo / 60)
    + ':' + pad(tzo % 60);
}

export function matchWords(match: string): string[] {
  // return match.split(/(?= )/gi).map(s => s.trim().replace(patterns.punctuation, '')).filter(s => !!s);
  return match.replace(patterns.punctuation, ' ').split(/(?= )/gi).map(s => s.trim()).filter(s => !!s);
}


// ---------------------------------------------------------------------------------------------------
//  deepAssign
// ---------------------------------------------------------------------------------------------------

/**
 * Copia las propiedades de un objeto (source) a otro (target).
 *
 * Copia los descriptores del objeto y los predecesores de sus prototipos en llamadas recursivas.
 * Los descriptores de la copia utilizan funciones proxy para establecer el contexto: el host.
 *
 * @param host: Se utiliza sólo durante las llamadas recursivas a los prototipos del objeto para aplicarlo desde las funciones proxy de los descriptores.
 * @param filterProperties: Filtra las propiedades que serán asignadas de un objeto a otro. Si no se establece se recorren todos los descriptores.
 */
export function deepAssign(target: object, source: any, options?: { host?: any, filterProperties?: string[] }): object {
  const host = options ? options.host || source : source;
  const filterProperties = options ? options.filterProperties : undefined;

  if (source) {
    // Referenciamos el proptotipo para obtener las propiedades del objeto predecesor (del que se hereda el objeto actual).
    const proto = Object.getPrototypeOf(source);
    // Realizamos la llamada recursiva hasta que lleguemos al Object superior.
    if (proto.constructor.name !== 'Object') { deepAssign(target, proto, { host, filterProperties }); }

    // Recursividad en arrays.
    if (Array.isArray(source)) {
      // Convertimos el objeto de destino en un array.
      if (!Array.isArray(target)) { target = []; }
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < source.length; i++) {
        const value = source[i];
        // Si existe un objeto que sobrescribir por otro objeto...
        if (typeof target[i] === 'object' && typeof value === 'object') {
          // Fusionamos los objetos.
          deepAssign(target[i], value, { host });
        } else {
          // Remplazamos el valor.
          target[i] = value;
        }
      }

    } else {
      target = target || {};
      // Obtenemos los descriptores del objeto actual.
      const descriptors = Object.getOwnPropertyNames(source).reduce((descriptor: any, key: any) => {
        // Excluímos el contructor.
        if (key !== 'constructor' && (filterProperties === undefined || filterProperties.includes(key))) {
          // Obtenemos el descriptor de la propiedad actual
          const descriptorProperty = Object.getOwnPropertyDescriptor(source, key);
          // NOTA: Algunas propiedades, como `length` en los arrays, usan su propio método interno y no son configurables.
          if (descriptorProperty.configurable) {
            // Establecemos el descriptor para el objeto de destino.
            descriptor[key] = descriptorProperty;
            // Encapsulamos las funciones para poder suministrar una referencia del objecto como contexto.
            if (typeof descriptor[key].value === 'function') { descriptor[key].value = (...args: any[]) => source[key].apply(host, args); }
            // Recursividad en los objetos, solo si es una propiedad del nivel actual cuyo valor sea un objeto no nulo...
            if (typeof descriptor[key].value === 'object' && descriptor[key].value !== null && target.hasOwnProperty(key)) { descriptor[key].value = deepAssign(target[key], source[key], { host }); }
            // Convertimos todas las propiedades en enumerables para poder iterarlas, por ejemplo mediante Object.keys().
            descriptor[key].enumerable = true;
          }
        }
        return descriptor;
      }, {});

      // Obtenemos también los descriptores de los Symbols enumerables definidos en el objeto actual.
      Object.getOwnPropertySymbols(source).forEach(symbol => {
        const descriptor: any = Object.getOwnPropertyDescriptor(source, symbol);
        if (descriptor.enumerable) { descriptors[symbol] = descriptor; } else {
          // console.warn('No se ha controlado esta casuística: Symbol not enumerable!\nEl código actual ha tomado el descriptor igualmente y lo ha convertido en enumerable para el objeto de destino (target)', { descriptor, symbol });
          descriptors[symbol] = descriptor;
          descriptors[symbol].enumerable = true;
        }
      });

      // Creamos las propiedades a partir de los descriptores obtenidos.
      Object.defineProperties(target || {}, descriptors);
    }
  }

  return target;
}


// ---------------------------------------------------------------------------------------------------
//  evalExpr
// ---------------------------------------------------------------------------------------------------

/** Opciones para la evaluación de código.
 * @param args: Indica los argumentos que se pasarán a la función de evaluación de código.
 * @param host: Indica el host del que se obtendran las propiedades adicionales que se pasaran como argumentos a la función de evaluación de código.
 * @param filterProperties: Filtra las propiedades que serán asignadas del host a los argumentos. Si no se establece se recorren todos los descriptores.
 */
export interface EvalExpressionOptions { host?: any; filterProperties?: string[]; args?: { [key: string]: any }; }

/** Evalúa una expresión que recibe como argumentos todas las propiedades del host más los argumentos adicionales suministrados mediante `args`.
 * ```typescript
 * interface EvalExpressionOptions { host?: any; filterProperties?: string[]; args?: { [key: string]: any }; }
 * ```
 */
export function evalExpr(expr: string, options?: EvalExpressionOptions): any {
  const host = options ? options.host : undefined;
  const filterProperties = options ? options.filterProperties : undefined;
  // Devolvemos la expresión cuando es: undefined, null, '', false.
  if (!expr) { return expr; }
  // Obtenemos todas las propiedades del host y sus prototipos.
  options.args = deepAssign(options.args || {}, options.host || {}, { filterProperties });
  // ---------------------------------------------------------------------------------------------------
  // NOTA: Después de transpilar se elimina el argumento 'this'. El host ya ha sido añadido en la instrucción anterior.
  // // Añadimos una referencia al host.
  // Object.assign(options.args, { this: options.host || {} });
  // ---------------------------------------------------------------------------------------------------
  // Evaluamos el código de la expresión.
  return evalCode(expr, options.args);
}


// ---------------------------------------------------------------------------------------------------
//  evalCode
// ---------------------------------------------------------------------------------------------------

/** Función para ejecutar código suministrado como un string. */
export function evalCode(code: string, args?: { [key: string]: any }, host?: any): any {
  if (!code) { return; }

  // // ---------------------------------------------------------------------------------------------------
  // //  OPCIÓN 1: Evaluar código Typescript.
  // // ---------------------------------------------------------------------------------------------------
  // // Obtenemos los nombres de los argumentos para la función wrapper.
  // const fnArgs = args ? Object.keys(args).map(k => `${k}: any`).join(', ') : '';
  // // Creamos un object literal con una función para encapsular el código que se desea ejecutar.
  // const wrapper = `({ fn: (${fnArgs}) => { return (${code}); } })`;

  // let transpiled = wrapper;
  // let runnable: any;

  // try {
  //   // Transpilamos el código Typescript para obtener código en Javascript.
  //   transpiled = ts.transpile(wrapper);

  // } catch (e) { throw new Error (`Transpilando el código '${code}'\n${e}\n\n> wrapper:\n${wrapper}`); }

  // try {
  //   // Evaluamos el código transpilado para obtener una instancia del objeto encapsulador
  //   // tslint:disable-next-line: no-eval
  //   runnable = eval(transpiled);

  // } catch (e) { throw new Error (`Evaluando el código '${code}'\n${e}\n\n> wrapper:\n${wrapper}\n\n> transpiled:\n${transpiled}`); }

  // try {
  //   // Obtenemos un array con los valores de los argumentos.
  //   const argArray = Object.keys(args || {}).map(k => (args || {})[k]);
  //   // Ejecutamos la función pasando los argumentos suministrados.
  //   return host ? runnable.fn.apply(host, argArray) : runnable.fn(...argArray);

  // } catch (e) { throw new Error (`Ejecutando el código '${code}'\n${e}\n\n> wrapper:\n${wrapper}\n\n> transpiled:\n${transpiled}`); }


  // ---------------------------------------------------------------------------------------------------
  //  OPCIÓN 2: Evaluar código Javascript.
  // ---------------------------------------------------------------------------------------------------
  // Obtenemos los nombres de los argumentos para la función wrapper.
  const fnArgs = args ? Object.keys(args).join(', ') : '';
  // Creamos un object literal con una función para encapsular el código que se desea ejecutar.
  const wrapper = `({ fn: function (${fnArgs}) { return (${code}); } });`;

  let runnable: any;

  try {
    // Evaluamos el código transpilado para obtener una instancia del objeto encapsulador
    // tslint:disable-next-line: no-eval
    runnable = eval(wrapper);

  } catch (e) { throw new Error (`Evaluando el código '${code}'\n${e}\n\n> wrapper:\n${wrapper}`); }

  try {
    // Obtenemos un array con los valores de los argumentos.
    const argArray = Object.keys(args || {}).map(k => (args || {})[k]);
    // Ejecutamos la función pasando los argumentos suministrados.
    return host ? runnable.fn.apply(host, argArray) : runnable.fn(...argArray);

  } catch (e) { throw new Error (`Ejecutando el código '${code}'\n${e}\n\n> wrapper:\n${wrapper}`); }

}
