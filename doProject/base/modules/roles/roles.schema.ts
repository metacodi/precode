import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const RolesSchema: EntitySchema = {
  name: 'roles',
  friendly: { singular: 'roles', plural: 'rol' },
  detail: {
    foreign: {
      idParent: { 'roles->parent(idParent)': '-permissions' },
    },
    frm: new FormGroup({
      idreg: new FormControl(),
      idParent: new FormControl(),
      abstract: new FormControl(false),
      name: new FormControl('', [Validators.required]),
    }),
    adding: (row: any, host: any) => deepAssign(row, { idParent: host.route.snapshot.params.idParent, abstract: false })
  },
  list: {
    fields: '-permissions',
    filter: ['name', 'parents'],
    foreign: {
      idParent: { 'roles->parent(idParent)': '-permissions' },
    },
    map: (row: any, host: any) => deepAssign(row, { parents: host.parents(row) }),
    search: ['abstract', '=', false],
  }
};
