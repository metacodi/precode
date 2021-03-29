import { EntitySchema } from 'src/core/abstract';
import { FormGroup, FormControl } from '@angular/forms';

import { ApiSearchClauses } from 'src/core/api';
import { AbstractListComponent, AbstractDetailComponent } from 'src/core/abstract';


export const DevicesSchema: EntitySchema = {
  name: 'devices',
  detail: {
    // route: 'mi-perfil/device/:id',
    mapping: (row: any, host: AbstractDetailComponent) => { row.info = JSON.parse(row.info); return row; },
    frm: new FormGroup({
      // idreg: new FormControl(),
      // allowChangeValidationOptions: new FormControl(),
      // allowStoreCredentials: new FormControl(),
      // allowBiometricValidation: new FormControl(),
    }),
  },
  list: {
    map: (row: any, host: AbstractListComponent) => {
      row.info = JSON.parse(row.info);
      row.lastLoginShortDate = host.localize.shortDate(row?.lastLogin);
      row.lastLoginLong = host.localize.longDateTime(row?.lastLogin);
      return row;
    },
    filter: [ 'description', 'info.model', 'info.manufacturer', 'lastLoginShortDate', 'lastLoginLong' ],
    orderBy: '-lastLogin',
    search: (host: any): ApiSearchClauses => ['idUser', '=', host.user.idreg],
  },
};
