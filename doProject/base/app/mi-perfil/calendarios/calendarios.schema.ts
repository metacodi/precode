import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const CalendariosSchema: EntitySchema = {
  name: 'calendarios',
  detail: {
    frm: new FormGroup({
      idreg: new FormControl(),
      calendario: new FormControl('', [Validators.required]),
    }),
  },
  list: {
    paginate: false,
    fields: 'idreg,calendario',
    orderBy: 'calendario',
    filter: ['calendario'],
  }
};
