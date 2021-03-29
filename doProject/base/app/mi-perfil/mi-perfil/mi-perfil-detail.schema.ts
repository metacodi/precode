import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';


export const MiPerfilDetailSchema: EntitySchema = {
  name: 'users',
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
};
