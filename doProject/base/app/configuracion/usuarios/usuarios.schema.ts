import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const UsuariosSchema: EntitySchema = {
  name: 'usuarios',
  backend: 'users',
  preload: true,
  detail: {
    foreign: {
      idRole: { role: 'name' },
    },
    frm: new FormGroup({
      idreg: new FormControl(),
      idRole: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      apellidos: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      telefono2: new FormControl(),
      email: new FormControl('', [Validators.required, Validators.email]),
    }),
  },
  list: {
    fields: 'idreg,nombre,apellidos,email,telefono,telefono2,role.name',
    orderBy: 'nombre, apellidos',
    filter: {
      pipeToBackend: true,
      pipe: 'nombre,apellidos,email,telefono,telefono2,role.name',
    },
  }
};
