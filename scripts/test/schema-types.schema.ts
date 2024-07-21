
interface EntitySchema {};

export const TransaccionesSchema: EntitySchema = {
  name: { singular: 'transaccion', plural: 'transacciones' },
  detail: {
    relations: [
      // ---------------------------------------------------------------------------------------------
      // TODO: Revisar la resolució de l'esquema a l'api de backend pq no es resol correctament.
      // Tot i que cuentaOrigen té una definció explícita pels seus pares entidad i divisa,
      // els hi adjunta a ella enlloc de fer-ho a la cuenta pare de la transacció que s'ha declarat primer.
      // ---------------------------------------------------------------------------------------------
      // 'cuenta', 'entidad[cuenta.idEntidad=entidad.idreg]',
      // 'divisa[cuenta.idDivisa=divisa.idreg]',
      // ---------------------------------------------------------------------------------------------
      // WORK-AROUND: utilitzem un àlies pel compte de la transacció i el desfem després a frontend a través del hook mapSchema.
      'cuentas->cuentaTransaccion', 'entidad[cuentaTransaccion.idEntidad=entidad.idreg]',
      'divisa[cuentaTransaccion.idDivisa=divisa.idreg]',
      // ---------------------------------------------------------------------------------------------
      'cotejados',

      'operacion[cotejados.idOperacion]',
      // 'cuenta->cuentaOrigen[operacion.idCuentaOrigen=cuentas.idreg]',
      // 'entidad[operacion.cuentaOrigen.idEntidad=entidad.idreg]',
      // 'divisa[cuentaOrigen.idDivisa=divisas.idreg]',
      // 'cuenta->cuentaDestino[operacion.idCuentaDestino=cuentas.idreg]',
      // 'entidad[operacion.cuentaDestino.idEntidad=entidad.idreg]',
      // 'divisa[cuentaDestino.idDivisa=divisas.idreg]',

      'orden[operacion.idOrden]',
      'divisa->divisaOrigen[orden.idDivisaOrigen=divisas.idreg]',
      'divisa->divisaDestino[orden.idDivisaDestino=divisas.idreg]',
      'proveedor[orden.idProveedor](idUser,comisionApp,validated)',
      'user[proveedor.idUser](nombre,apellidos,email,telefono)',
      'cliente[orden.idCliente](idUser,idProveedor,deleted)',
      'user[cliente.idUser](nombre,apellidos,email,telefono,banned,validated,created,deleted)',

      'remesa[cotejados.idRemesa]',
      'cuenta->cuentaOrigen[remesa.idCuentaOrigen=cuentas.idreg]',
      'entidad[cuentaOrigen.idEntidad=entidad.idreg]',
      'divisa[cuentaOrigen.idDivisa=divisas.idreg]',
      'cuenta->cuentaDestino[remesa.idCuentaDestino=cuentas.idreg]',
      'entidad[cuentaDestino.idEntidad=entidad.idreg]',
      'divisa[cuentaDestino.idDivisa=divisas.idreg]',
    ],
    mapSchema: schema => {
      // ---------------------------------------------------------------------------------------------
      // WORK-AROUND: rectifiquem l'àlies pel compte de la transacció que hem hagut d'utilitzar per diferenciar-lo dels comptes d'origen i destí de l'operació.
      const found = schema.parentTables.find(t => t.tableAlias === 'cuentaTransaccion');
      if (found) { found.tableAlias = 'cuenta'; }
      // ---------------------------------------------------------------------------------------------
      return schema;
    },
  },
  list: {
    mapSchema: schema => {
      schema.fields.push({ Field: 'diaFecha', Type: 'varchar' });
      schema.fields.push({ Field: 'diaFechaValor', Type: 'varchar' });
      return schema;
    },
    fields: '-created,updated',
    relations: [
      'divisa(isoCode,digits,symbol)',
      'cuenta(idreg,idEntidad,idDivisa,externalId,alias,IBAN,beneficiario,comisionImplicita)',
      'entidad(nombre,alias)',
    ],
  }
};


export const DepositosCotejablesSchema: EntitySchema = {
  name: { singular: 'deposito', plural: 'depositos' },
  backend: { singular: 'transacciones.depositosCotejables', plural: 'transacciones.depositosCotejables' },
  list: {
    mapSchema: schema => {
      schema.fields.push({ Field: 'diaCreacion', Type: 'varchar' });
      const schemaUserCliente = schema.parentTables.find(v => v.tableAlias.split('.').pop() === 'cliente').parentTables.find(v => v.tableAlias.split('.').pop() === 'user');
      schemaUserCliente.fields.push({ Field: 'nombre_apellidos', Type: 'varchar' });
      const schemaUserProveedor = schema.parentTables.find(v => v.tableAlias.split('.').pop() === 'proveedor').parentTables.find(v => v.tableAlias.split('.').pop() === 'user');
      schemaUserProveedor.fields.push({ Field: 'nombre_apellidos', Type: 'varchar' });
      return schema;
    },
  }
};

export const RemesasCotejablesSchema: EntitySchema = {
  name: { singular: 'remesa', plural: 'remesas' },
  backend: { singular: 'transacciones.remesasCotejables', plural: 'transacciones.remesasCotejables' },
  list: {
    mapSchema: schema => {
      schema.fields.push({ Field: 'diaCreacion', Type: 'varchar' });
      // const schemaUserCliente = schema.parentTables.find(v => v.tableAlias.split('.').pop() === 'cliente').parentTables.find(v => v.tableAlias.split('.').pop() === 'user');
      // schemaUserCliente.fields.push({ Field: 'nombre_apellidos', Type: 'varchar' });
      // const schemaUserProveedor = schema.parentTables.find(v => v.tableAlias.split('.').pop() === 'proveedor').parentTables.find(v => v.tableAlias.split('.').pop() === 'user');
      // schemaUserProveedor.fields.push({ Field: 'nombre_apellidos', Type: 'varchar' });
      return schema;
    },
  }
};
