import { ApiSearchClauses } from 'src/core/api';
import { stringOrExpr } from 'src/core/meta';

/** Define los tipos de acciones sobre el componente. */
export type ListSettingsActionEvent = 'groupBy' | 'find' | 'advancedSearch' | 'restartSettings' | 'print';


/** Define las opciones de configuración de un grupo (agrupación de las filas de la consulta). */
export interface AbstractListSettingsGroup {
  name: string;
  visible: boolean;
  fields: string | ((row: any, host: any) => any);
  label: string;
  orderBy: string;
}

export interface AbstractListSettingsFilterPipeValue {
  value: boolean;
  fields: string;
  label: string;
}

/** Define una búsqueda predefinida para la propiedad `search`. */
export interface AbstractListSettingsSearchValue {
  name: string;
  visible: boolean;
  label: stringOrExpr;
  icon: { tipo?: string; value: boolean | string | number; color?: string; };
  search: { info: stringOrExpr; clauses: ApiSearchClauses | ApiSearchClauses[]; };
}

/** Define las opciones de configuración de un componente de listado. */
export interface AbstractListSettings {

  /** Modos de visualización. */
  view?: {
    /** Indica si la sección se mostrará o no. */
    visible: boolean;
    /** Indica el nombre (propiedad `name`) del item actualmente seleccionada. */
    current: string;
    /** Define las diversas visualizaciones implementadas para el componente (lista, cards, graphics, etc.). */
    values: {
      name: string;
      label: string;
      options?: { [key: string]: { value: boolean; label: string; } } | { value: boolean; label: string; }[];
    }[];
  };

  /** Consultas predefinidas. */
  search?: {
    /** Indica si la sección se mostrará o no. */
    visible: boolean;
    /** Búsqueda actual. Puede ser 'cache', 'avanzada' o alguna de las listadas en la propiedad `values`. */
    current: 'cache' | 'avanzada' | 'words' | string;
    /** Definiciones de las consultas predefinidas. */
    values: AbstractListSettingsSearchValue[];
    /** Configuración del filtro para las búsquedas. Sólo si se establece `search.settingsOn` en `true`. */
    filter?: {
      itemsPerPage: number;
      pipeToBackend: boolean;
      splitPipeWords: boolean;
      concatPipeWords: 'AND' | 'OR';
      ignoreCase: boolean;
      pipe: AbstractListSettingsFilterPipeValue[];
    };
  };

  /** Impresiones. */
  print?: {
    /** Indica si la sección se mostrará o no. */
    visible: boolean;
    /** Definiciones de las impresiones disponibles. */
    values: {
      visible: boolean;
      label: stringOrExpr;
      icon?: { tipo?: string; value: boolean | string | number; color?: string; };
      notes?: { label: string; color?: string; }[],
    }[];
  };

  /** Agrupaciones de resultados. */
  group?: {
    /** Indica si la sección se mostrará o no. */
    visible: boolean;
    /** Indica el grupo actualmente establecido. */
    current?: string;
    /** Definiciones de las posibles agrupaciones de los resultados. */
    values: AbstractListSettingsGroup[];
  };

}

/** @experimental */
export interface AbstractListState {
  /** Definición de las columnas. */
  columns: {
    size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto';
    label?: string;
    icon?: string | { src?: string; name?: string; color?: string };
    draggable?: boolean;
    visible?: boolean;
  }[];
  /** Indica si las columnas se pueden reordenar. */
  draggable?: boolean;
  /** Ordenación de los elementos. Acepta múltiples columnas (orden secundario, etc.). */
  // Ex: ['nombre', '-apellidos'];
  orderBy?: (string | { field: string; direction: '+' | '-' | 'ASC' | 'DESC' | 1 | -1; })[];
  /** Indica  */
  groupBy?: { field: string, subGroup?: any };
}
