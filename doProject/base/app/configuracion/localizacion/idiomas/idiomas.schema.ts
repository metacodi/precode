import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const IdiomasSchema: EntitySchema = {
  name: 'lang',
  detail: {
    frm: new FormGroup({
      idreg: new FormControl(),
      isoName: new FormControl('', [Validators.required]),
      nativeName: new FormControl('', [Validators.required]),
      active: new FormControl('', [Validators.required]),
      isoCode: new FormControl('', [Validators.required]),
      langCode: new FormControl('', [Validators.required]),
      phpDateFormat: new FormControl('', [Validators.required]),
      phpDateTimeFormat: new FormControl('', [Validators.required]),
    }),
  },
  list: {
    fields: 'idreg,nativeName,active,isoCode',
    orderBy: 'nativeName',
    filter: ['nativeName'],
  }
};
