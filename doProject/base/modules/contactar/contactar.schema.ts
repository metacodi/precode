import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';


export const ContactarSchema: EntitySchema = {
  name: { singular: 'contactar', plural: 'contactar' },
  detail: {
    id: 'new',
    frm: new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellidos: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      mensaje: new FormControl('', [Validators.required]),
    }),
  },
};
