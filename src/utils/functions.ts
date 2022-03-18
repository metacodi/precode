
// ---------------------------------------------------------------------------------------------------
//  applyFilterPattern . FilterPatternType
// ---------------------------------------------------------------------------------------------------

export type FilterPatternType = string | RegExp | ((pattern: string) => boolean) | { test: RegExp | ((pattern: string) => boolean) };

/**
 * Comprova si el texte compleix el patró de filtre indicat.
 * @returns Retorna `true` quan el texte compleix amb el patró de filtre o si no se n'indica cap.
 * ```typescript
 * type FilterPatternType = string | RegExp | ((pattern: string) => boolean) | { test: (pattern: string) => boolean };
 * ```
 */
export function applyFilterPattern(text: string, pattern?: FilterPatternType): boolean {

  if (!pattern || !text) { return true; }

  if (typeof pattern === 'string') {
    const tester = new RegExp(pattern);
    return tester.test(text);

  } else if (pattern instanceof RegExp) {
    const tester: RegExp = pattern;
    return tester.test(text);

  } else if (typeof pattern === 'function') {
    return pattern(text);

  } else if (typeof pattern === 'object') {

    if (pattern.test instanceof RegExp) {
      const tester: RegExp = pattern.test;
      return tester.test(text);

    } else if (typeof pattern.test === 'function') {
      const tester: (pattern: string) => boolean = pattern.test;
      return tester(text);
    }

  } else {
    // throw (`Unrecognized pattern type`);
    return true;
  }
}


// ---------------------------------------------------------------------------------------------------
//  capitalize string
// ---------------------------------------------------------------------------------------------------

export function capitalize(text: string): string {
  if (typeof text !== 'string') { return ''; }
  if (text.length < 2) { return text.toUpperCase(); }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
