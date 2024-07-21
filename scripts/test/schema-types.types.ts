/**
 * ```typescript
 * export interface Transaccion {
 *   idreg: number;
 *   idCuenta: number | null;
 *   externalRef: string | null;
 *   canal: number | null;
 *   estado: number;
 *   validaciones: number | null;
 *   incidencias: number | null;
 *   fecha: string | null;
 *   fechaValor: string | null;
 *   concepto: string | null;
 *   importe: number | null;
 *   saldo: number | null;
 *   comision: number;
 *   descripcion: string | null;
 *   tags: string | null;
 *   contrapart: (string | {
 *     [key: string]: any;
 *   }) | null;
 *   created: string | null;
 *   updated: string | null;
 *   cuenta?: {
 *     idreg: number;
 *     idCliente: number | null;
 *     idProveedor: number | null;
 *     idEntidad: number | null;
 *     idDivisa: number;
 *     externalId: string | null;
 *     alias: string | null;
 *     IBAN: string | null;
 *     SWIFT: string | null;
 *     BIC: string | null;
 *     direccionOficina: string | null;
 *     beneficiario: string | null;
 *     saldo: number;
 *     disponible: number;
 *     bloqueado: number;
 *     ratioAverage: number;
 *     comisionImplicita: boolean;
 *     created: string | null;
 *     updated: string | null;
 *     deleted: string | null;
 *     entidad?: {
 *       idreg: number;
 *       nombre: string;
 *       tipo: number;
 *       codigo: string;
 *       alias: string | null;
 *     };
 *     divisa: {
 *       idreg: number;
 *       tipo: number;
 *       isoCode: string;
 *       isoNum: string;
 *       digits: number;
 *       symbol: string | null;
 *       englishName: string;
 *     };
 *   };
 *   cotejados: {
 *     idreg: number;
 *     idTransaccion: number | null;
 *     idOperacion: number | null;
 *     idRemesa: number | null;
 *     idRetiro: number | null;
 *     idFactura: number | null;
 *     idCheque: number | null;
 *     importe: number | null;
 *     operacion?: {
 *       idreg: number;
 *       idFase: number | null;
 *       idOrden: number | null;
 *       idRemesa: number | null;
 *       estado: number;
 *       tipo: number;
 *       posicion: number;
 *       idCuentaOrigen: number | null;
 *       idCuentaDestino: number | null;
 *       importeOrigen: number | null;
 *       importeDestino: number | null;
 *       cargoComision: boolean;
 *       created: string | null;
 *       updated: string | null;
 *       orden?: {
 *         idreg: number;
 *         idOperativa: number | null;
 *         idCliente: number | null;
 *         idProveedor: number | null;
 *         tipo: number;
 *         referencia: string | null;
 *         estado: number;
 *         operacion: number | null;
 *         comprobante: number | null;
 *         pagadoCliente: boolean;
 *         importeOrigen: number;
 *         importeDestino: number | null;
 *         idDivisaOrigen: number;
 *         idDivisaDestino: number;
 *         comisionApp: number | null;
 *         idDevolucion: number | null;
 *         created: string | null;
 *         updated: string | null;
 *         divisaOrigen: {
 *           idreg: number;
 *           tipo: number;
 *           isoCode: string;
 *           isoNum: string;
 *           digits: number;
 *           symbol: string | null;
 *           englishName: string;
 *         };
 *         divisaDestino: {
 *           idreg: number;
 *           tipo: number;
 *           isoCode: string;
 *           isoNum: string;
 *           digits: number;
 *           symbol: string | null;
 *           englishName: string;
 *         };
 *         proveedor?: {
 *           idreg: number;
 *           idUser: number | null;
 *           comisionApp: number;
 *           validated: boolean;
 *           user?: {
 *             idreg: number;
 *             nombre: string | null;
 *             apellidos: string | null;
 *             telefono: string | null;
 *             email: string;
 *           };
 *         };
 *         cliente?: {
 *           idreg: number;
 *           idUser: number | null;
 *           idProveedor: number | null;
 *           deleted: string | null;
 *           user?: {
 *             idreg: number;
 *             nombre: string | null;
 *             apellidos: string | null;
 *             telefono: string | null;
 *             email: string;
 *             validated: number;
 *             created: string | null;
 *             deleted: string | null;
 *             banned: string | null;
 *           };
 *         };
 *       };
 *     };
 *     remesa?: {
 *       idreg: number;
 *       idCuentaOrigen: number;
 *       idCuentaDestino: number | null;
 *       referencia: string | null;
 *       externalRef: string | null;
 *       tipo: number;
 *       estado: number;
 *       automatizar: boolean;
 *       importeOrigen: number;
 *       importeDestino: number | null;
 *       ratio: number | null;
 *       comisionOrigen: number | null;
 *       comisionDestino: number | null;
 *       operationDate: string | null;
 *       created: string | null;
 *       updated: string | null;
 *       cuentaOrigen: {
 *         idreg: number;
 *         idCliente: number | null;
 *         idProveedor: number | null;
 *         idEntidad: number | null;
 *         idDivisa: number;
 *         externalId: string | null;
 *         alias: string | null;
 *         IBAN: string | null;
 *         SWIFT: string | null;
 *         BIC: string | null;
 *         direccionOficina: string | null;
 *         beneficiario: string | null;
 *         saldo: number;
 *         disponible: number;
 *         bloqueado: number;
 *         ratioAverage: number;
 *         comisionImplicita: boolean;
 *         created: string | null;
 *         updated: string | null;
 *         deleted: string | null;
 *         entidad?: {
 *           idreg: number;
 *           nombre: string;
 *           tipo: number;
 *           codigo: string;
 *           alias: string | null;
 *         };
 *         divisa: {
 *           idreg: number;
 *           tipo: number;
 *           isoCode: string;
 *           isoNum: string;
 *           digits: number;
 *           symbol: string | null;
 *           englishName: string;
 *         };
 *       };
 *       cuentaDestino?: {
 *         idreg: number;
 *         idCliente: number | null;
 *         idProveedor: number | null;
 *         idEntidad: number | null;
 *         idDivisa: number;
 *         externalId: string | null;
 *         alias: string | null;
 *         IBAN: string | null;
 *         SWIFT: string | null;
 *         BIC: string | null;
 *         direccionOficina: string | null;
 *         beneficiario: string | null;
 *         saldo: number;
 *         disponible: number;
 *         bloqueado: number;
 *         ratioAverage: number;
 *         comisionImplicita: boolean;
 *         created: string | null;
 *         updated: string | null;
 *         deleted: string | null;
 *         entidad?: {
 *           idreg: number;
 *           nombre: string;
 *           tipo: number;
 *           codigo: string;
 *           alias: string | null;
 *         };
 *         divisa: {
 *           idreg: number;
 *           tipo: number;
 *           isoCode: string;
 *           isoNum: string;
 *           digits: number;
 *           symbol: string | null;
 *           englishName: string;
 *         };
 *       };
 *     };
 *   }[];
 * }
 * ```
 */
export interface Transaccion {
  idreg: number;
  idCuenta: number | null;
  externalRef: string | null;
  canal: number | null;
  estado: number;
  validaciones: number | null;
  incidencias: number | null;
  fecha: string | null;
  fechaValor: string | null;
  concepto: string | null;
  importe: number | null;
  saldo: number | null;
  comision: number;
  descripcion: string | null;
  tags: string | null;
  contrapart: (string | {
    [key: string]: any;
  }) | null;
  created: string | null;
  updated: string | null;
  cuenta?: {
    idreg: number;
    idCliente: number | null;
    idProveedor: number | null;
    idEntidad: number | null;
    idDivisa: number;
    externalId: string | null;
    alias: string | null;
    IBAN: string | null;
    SWIFT: string | null;
    BIC: string | null;
    direccionOficina: string | null;
    beneficiario: string | null;
    saldo: number;
    disponible: number;
    bloqueado: number;
    ratioAverage: number;
    comisionImplicita: boolean;
    created: string | null;
    updated: string | null;
    deleted: string | null;
    entidad?: {
      idreg: number;
      nombre: string;
      tipo: number;
      codigo: string;
      alias: string | null;
    };
    divisa: {
      idreg: number;
      tipo: number;
      isoCode: string;
      isoNum: string;
      digits: number;
      symbol: string | null;
      englishName: string;
    };
  };
  cotejados: {
    idreg: number;
    idTransaccion: number | null;
    idOperacion: number | null;
    idRemesa: number | null;
    idRetiro: number | null;
    idFactura: number | null;
    idCheque: number | null;
    importe: number | null;
    operacion?: {
      idreg: number;
      idFase: number | null;
      idOrden: number | null;
      idRemesa: number | null;
      estado: number;
      tipo: number;
      posicion: number;
      idCuentaOrigen: number | null;
      idCuentaDestino: number | null;
      importeOrigen: number | null;
      importeDestino: number | null;
      cargoComision: boolean;
      created: string | null;
      updated: string | null;
      orden?: {
        idreg: number;
        idOperativa: number | null;
        idCliente: number | null;
        idProveedor: number | null;
        tipo: number;
        referencia: string | null;
        estado: number;
        operacion: number | null;
        comprobante: number | null;
        pagadoCliente: boolean;
        importeOrigen: number;
        importeDestino: number | null;
        idDivisaOrigen: number;
        idDivisaDestino: number;
        comisionApp: number | null;
        idDevolucion: number | null;
        created: string | null;
        updated: string | null;
        divisaOrigen: {
          idreg: number;
          tipo: number;
          isoCode: string;
          isoNum: string;
          digits: number;
          symbol: string | null;
          englishName: string;
        };
        divisaDestino: {
          idreg: number;
          tipo: number;
          isoCode: string;
          isoNum: string;
          digits: number;
          symbol: string | null;
          englishName: string;
        };
        proveedor?: {
          idreg: number;
          idUser: number | null;
          comisionApp: number;
          validated: boolean;
          user?: {
            idreg: number;
            nombre: string | null;
            apellidos: string | null;
            telefono: string | null;
            email: string;
          };
        };
        cliente?: {
          idreg: number;
          idUser: number | null;
          idProveedor: number | null;
          deleted: string | null;
          user?: {
            idreg: number;
            nombre: string | null;
            apellidos: string | null;
            telefono: string | null;
            email: string;
            validated: number;
            created: string | null;
            deleted: string | null;
            banned: string | null;
          };
        };
      };
    };
    remesa?: {
      idreg: number;
      idCuentaOrigen: number;
      idCuentaDestino: number | null;
      referencia: string | null;
      externalRef: string | null;
      tipo: number;
      estado: number;
      automatizar: boolean;
      importeOrigen: number;
      importeDestino: number | null;
      ratio: number | null;
      comisionOrigen: number | null;
      comisionDestino: number | null;
      operationDate: string | null;
      created: string | null;
      updated: string | null;
      cuentaOrigen: {
        idreg: number;
        idCliente: number | null;
        idProveedor: number | null;
        idEntidad: number | null;
        idDivisa: number;
        externalId: string | null;
        alias: string | null;
        IBAN: string | null;
        SWIFT: string | null;
        BIC: string | null;
        direccionOficina: string | null;
        beneficiario: string | null;
        saldo: number;
        disponible: number;
        bloqueado: number;
        ratioAverage: number;
        comisionImplicita: boolean;
        created: string | null;
        updated: string | null;
        deleted: string | null;
        entidad?: {
          idreg: number;
          nombre: string;
          tipo: number;
          codigo: string;
          alias: string | null;
        };
        divisa: {
          idreg: number;
          tipo: number;
          isoCode: string;
          isoNum: string;
          digits: number;
          symbol: string | null;
          englishName: string;
        };
      };
      cuentaDestino?: {
        idreg: number;
        idCliente: number | null;
        idProveedor: number | null;
        idEntidad: number | null;
        idDivisa: number;
        externalId: string | null;
        alias: string | null;
        IBAN: string | null;
        SWIFT: string | null;
        BIC: string | null;
        direccionOficina: string | null;
        beneficiario: string | null;
        saldo: number;
        disponible: number;
        bloqueado: number;
        ratioAverage: number;
        comisionImplicita: boolean;
        created: string | null;
        updated: string | null;
        deleted: string | null;
        entidad?: {
          idreg: number;
          nombre: string;
          tipo: number;
          codigo: string;
          alias: string | null;
        };
        divisa: {
          idreg: number;
          tipo: number;
          isoCode: string;
          isoNum: string;
          digits: number;
          symbol: string | null;
          englishName: string;
        };
      };
    };
  }[];
}

/**
 * ```typescript
 * export interface Transacciones {
 *   idreg: number;
 *   idCuenta: number | null;
 *   externalRef: string | null;
 *   canal: number | null;
 *   estado: number;
 *   validaciones: number | null;
 *   incidencias: number | null;
 *   fecha: string | null;
 *   fechaValor: string | null;
 *   concepto: string | null;
 *   importe: number | null;
 *   saldo: number | null;
 *   comision: number;
 *   descripcion: string | null;
 *   tags: string | null;
 *   contrapart: (string | {
 *     [key: string]: any;
 *   }) | null;
 *   diaFecha: string;
 *   diaFechaValor: string;
 *   cuenta?: {
 *     idreg: number;
 *     idEntidad: number | null;
 *     idDivisa: number;
 *     externalId: string | null;
 *     alias: string | null;
 *     IBAN: string | null;
 *     beneficiario: string | null;
 *     comisionImplicita: boolean;
 *     divisa: {
 *       idreg: number;
 *       isoCode: string;
 *       digits: number;
 *       symbol: string | null;
 *     };
 *     entidad?: {
 *       idreg: number;
 *       nombre: string;
 *       alias: string | null;
 *     };
 *   };
 * }
 * ```
 */
export interface Transacciones {
  idreg: number;
  idCuenta: number | null;
  externalRef: string | null;
  canal: number | null;
  estado: number;
  validaciones: number | null;
  incidencias: number | null;
  fecha: string | null;
  fechaValor: string | null;
  concepto: string | null;
  importe: number | null;
  saldo: number | null;
  comision: number;
  descripcion: string | null;
  tags: string | null;
  contrapart: (string | {
    [key: string]: any;
  }) | null;
  diaFecha: string;
  diaFechaValor: string;
  cuenta?: {
    idreg: number;
    idEntidad: number | null;
    idDivisa: number;
    externalId: string | null;
    alias: string | null;
    IBAN: string | null;
    beneficiario: string | null;
    comisionImplicita: boolean;
    divisa: {
      idreg: number;
      isoCode: string;
      digits: number;
      symbol: string | null;
    };
    entidad?: {
      idreg: number;
      nombre: string;
      alias: string | null;
    };
  };
}

/**
 * ```typescript
 * export interface Depositos {
 *   idreg: number;
 *   idOperativa: number | null;
 *   idCliente: number | null;
 *   idProveedor: number | null;
 *   tipo: number;
 *   referencia: string | null;
 *   estado: number;
 *   operacion: number | null;
 *   comprobante: number | null;
 *   importeOrigen: number;
 *   importeDestino: number | null;
 *   idDivisaOrigen: number;
 *   idDivisaDestino: number;
 *   comisionApp: number | null;
 *   created: string | null;
 *   diaCreacion: string;
 *   divisaOrigen: {
 *     idreg: number;
 *     tipo: number;
 *     isoCode: string;
 *     isoNum: string;
 *     digits: number;
 *     symbol: string | null;
 *     englishName: string;
 *   };
 *   divisaDestino: {
 *     idreg: number;
 *     tipo: number;
 *     isoCode: string;
 *     isoNum: string;
 *     digits: number;
 *     symbol: string | null;
 *     englishName: string;
 *   };
 *   proveedor?: {
 *     idreg: number;
 *     idUser: number | null;
 *     validated: boolean;
 *     user?: {
 *       idreg: number;
 *       nombre: string | null;
 *       apellidos: string | null;
 *       telefono: string | null;
 *       email: string;
 *       nombre_apellidos: string;
 *     };
 *   };
 *   cliente?: {
 *     idreg: number;
 *     idUser: number | null;
 *     idProveedor: number | null;
 *     deleted: string | null;
 *     user?: {
 *       idreg: number;
 *       nombre: string | null;
 *       apellidos: string | null;
 *       ordenantes: (string | {
 *         [key: string]: any;
 *       }) | null;
 *       telefono: string | null;
 *       email: string;
 *       validated: number;
 *       created: string | null;
 *       deleted: string | null;
 *       banned: string | null;
 *       nombre_apellidos: string;
 *     };
 *   };
 * }
 * ```
 */
export interface Depositos {
  idreg: number;
  idOperativa: number | null;
  idCliente: number | null;
  idProveedor: number | null;
  tipo: number;
  referencia: string | null;
  estado: number;
  operacion: number | null;
  comprobante: number | null;
  importeOrigen: number;
  importeDestino: number | null;
  idDivisaOrigen: number;
  idDivisaDestino: number;
  comisionApp: number | null;
  created: string | null;
  diaCreacion: string;
  divisaOrigen: {
    idreg: number;
    tipo: number;
    isoCode: string;
    isoNum: string;
    digits: number;
    symbol: string | null;
    englishName: string;
  };
  divisaDestino: {
    idreg: number;
    tipo: number;
    isoCode: string;
    isoNum: string;
    digits: number;
    symbol: string | null;
    englishName: string;
  };
  proveedor?: {
    idreg: number;
    idUser: number | null;
    validated: boolean;
    user?: {
      idreg: number;
      nombre: string | null;
      apellidos: string | null;
      telefono: string | null;
      email: string;
      nombre_apellidos: string;
    };
  };
  cliente?: {
    idreg: number;
    idUser: number | null;
    idProveedor: number | null;
    deleted: string | null;
    user?: {
      idreg: number;
      nombre: string | null;
      apellidos: string | null;
      ordenantes: (string | {
        [key: string]: any;
      }) | null;
      telefono: string | null;
      email: string;
      validated: number;
      created: string | null;
      deleted: string | null;
      banned: string | null;
      nombre_apellidos: string;
    };
  };
}

/**
 * ```typescript
 * export interface Remesas {
 *   idreg: number;
 *   idCuentaOrigen: number;
 *   idCuentaDestino: number | null;
 *   referencia: string | null;
 *   externalRef: string | null;
 *   tipo: number;
 *   estado: number;
 *   automatizar: boolean;
 *   importeOrigen: number;
 *   importeDestino: number | null;
 *   ratio: number | null;
 *   comisionOrigen: number | null;
 *   comisionDestino: number | null;
 *   operationDate: string | null;
 *   created: string | null;
 *   diaCreacion: string;
 *   cuentaOrigen: {
 *     idreg: number;
 *     idEntidad: number | null;
 *     idDivisa: number;
 *     externalId: string | null;
 *     alias: string | null;
 *     IBAN: string | null;
 *     comisionImplicita: boolean;
 *     entidad?: {
 *       idreg: number;
 *       nombre: string;
 *       tipo: number;
 *       codigo: string;
 *       alias: string | null;
 *     };
 *     divisa: {
 *       idreg: number;
 *       tipo: number;
 *       isoCode: string;
 *       digits: number;
 *       symbol: string | null;
 *       englishName: string;
 *     };
 *   };
 *   cuentaDestino?: {
 *     idreg: number;
 *     idEntidad: number | null;
 *     idDivisa: number;
 *     externalId: string | null;
 *     alias: string | null;
 *     IBAN: string | null;
 *     comisionImplicita: boolean;
 *     entidad?: {
 *       idreg: number;
 *       nombre: string;
 *       tipo: number;
 *       codigo: string;
 *       alias: string | null;
 *     };
 *     divisa: {
 *       idreg: number;
 *       tipo: number;
 *       isoCode: string;
 *       digits: number;
 *       symbol: string | null;
 *       englishName: string;
 *     };
 *   };
 * }
 * ```
 */
export interface Remesas {
  idreg: number;
  idCuentaOrigen: number;
  idCuentaDestino: number | null;
  referencia: string | null;
  externalRef: string | null;
  tipo: number;
  estado: number;
  automatizar: boolean;
  importeOrigen: number;
  importeDestino: number | null;
  ratio: number | null;
  comisionOrigen: number | null;
  comisionDestino: number | null;
  operationDate: string | null;
  created: string | null;
  diaCreacion: string;
  cuentaOrigen: {
    idreg: number;
    idEntidad: number | null;
    idDivisa: number;
    externalId: string | null;
    alias: string | null;
    IBAN: string | null;
    comisionImplicita: boolean;
    entidad?: {
      idreg: number;
      nombre: string;
      tipo: number;
      codigo: string;
      alias: string | null;
    };
    divisa: {
      idreg: number;
      tipo: number;
      isoCode: string;
      digits: number;
      symbol: string | null;
      englishName: string;
    };
  };
  cuentaDestino?: {
    idreg: number;
    idEntidad: number | null;
    idDivisa: number;
    externalId: string | null;
    alias: string | null;
    IBAN: string | null;
    comisionImplicita: boolean;
    entidad?: {
      idreg: number;
      nombre: string;
      tipo: number;
      codigo: string;
      alias: string | null;
    };
    divisa: {
      idreg: number;
      tipo: number;
      isoCode: string;
      digits: number;
      symbol: string | null;
      englishName: string;
    };
  };
}