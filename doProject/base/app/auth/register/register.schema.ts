import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { MatchValidator } from 'src/core/util';

import { ROLE_CLIENTE } from 'src/app/model';


export const RegisterSchema: EntitySchema = {
  // backend: 'users',
  name: 'register',
  detail: {
    id: 'new',
    route: 'register',
    flatRow: true,
    frm: new FormGroup({
      // idreg: new FormControl(),
      nombre: new FormControl('', [Validators.required]),
      apellidos: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      telefono2: new FormControl(),
      email: new FormControl('', [Validators.required, Validators.email]),
      passwords: new FormGroup({
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirm: new FormControl('', [Validators.required, Validators.minLength(6)]),
      }, MatchValidator),
      aceptoCondiciones: new FormControl(false),
      idRole: new FormControl(ROLE_CLIENTE),
      pin: new FormControl(),
    }),
  },
};
