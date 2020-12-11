import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';


export const ValidateSchema: EntitySchema = {
  name: 'validateByPin',
  detail: {
    frm: new FormGroup({
      idreg: new FormControl(),
      pin: new FormControl('', [Validators.required, Validators.minLength(4)]),
    }),
  },
};
