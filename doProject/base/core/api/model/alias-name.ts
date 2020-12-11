
/** Declaración de una tabla o una columna de la base de datos. */
export class AliasName {
  /** Nombre de la tabla o la columna. */
  name: string;
  /** Alias para la tabla o la columna. */
  alias?: string;
  /** Separadores para encerrar los nombres de las tablas o columnas */
  private quotes: string | { open: string, close: string } = '`';

  /**
   * @param entityName Un nombre válido para una entidad.
   * @param quotes An string is used for both opening and ending quotes, by default is MySql quote. It's possible indicate different using an object literal like `{ open: string, close: string }`.
   */
  static parse(entityName: string | AliasName, quotes: string | { open: string, close: string } = '`'): AliasName {
    // Comprobamos si se ha expresado como un string. Ej: 'name->alias'
    if (typeof entityName === 'string') {
      // Descomponemos la cadena de texto.
      const { name, alias } = AliasName.parseName(entityName);
      return new AliasName(name, alias, quotes);

    } else if (typeof entityName === 'object') {

      if (entityName.hasOwnProperty('name') && entityName.hasOwnProperty('alias')) {
        // AliasName
        return (entityName as any).clone();

      } else {
        throw new Error(`Invalid argument for parse an AliasName`);
      }

    } else {
      throw new Error(`Invalid argument for parse an AliasName`);
    }
  }

  static parseName(entityName: string): { name: string; alias: string } {
    // Descomponemos la cadena de texto.
    const parts = entityName.split('->');
    const name: string = parts[0];
    const alias: string = parts.length > 1 ? parts[1] : '';
    return { name, alias };
  }

  constructor(entityName: string, entityAlias?: string, quotes: string | { open: string, close: string } = '`') {
    // console.log('AliasName.constructor(entityName, entityAlias) => ', { entityName, entityAlias });
    this.name = entityName;
    this.alias = entityAlias;
    this.quotes = quotes;
    // Puede que se haya indicado el nombre como entityName = 'name->alias'
    if (!entityAlias) {
      const { name, alias } = AliasName.parseName(entityName);
      if (alias) {
        // console.log('AliasName.constructor() -> solved => ', { name, alias });
        this.name = name;
        this.alias = alias;
      }
    }
  }

  /** Devuelve el alias de la tabla y si no está establecido devuelve su nombre. */
  get aliasOrName(): string {
    // Si no hay alias devolvemos el nombre.
    return this.alias || this.name;
  }

  /** Devuelve la declaración de la entidad para la ApiRest: `'name->alias'`. */
  toUrl(): string {
    return this.name + (this.alias ? '->' + this.alias : '');
  }

  /** Devuelve la declaración de la entidad en formato SQL: ```'`name` AS `alias`'```. */
  toSql(): string {
    const entityName: string = this.enclose(this.name);
    const entityAlias: string = this.enclose(this.alias || '');
    return entityName + (this.alias ? ' AS ' + entityAlias : '');
  }

  /** Devuelve el nombre de la entidad encerrado entre separadores. */
  private enclose(name: string): string {
    const open = typeof this.quotes === 'string' ? this.quotes : this.quotes.open || '';
    const close = typeof this.quotes === 'string' ? this.quotes : this.quotes.close || '';
    return open + name + close;
  }

  /** Devuelve una entidad completamente nueva con los mismos valores que la actual. */
  clone(): AliasName { return new AliasName(this.name, this.alias, this.quotes); }
}
