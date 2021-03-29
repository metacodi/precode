import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const PoblacionesSchema: EntitySchema = {
  name: { singular: 'poblacion', plural: 'poblaciones' },
  detail: {
    frm: new FormGroup({
      idreg: new FormControl(),
      locality: new FormControl('', [Validators.required]),
      aliasLocality: new FormControl('', [Validators.required]),
      administrative_area_level_2: new FormControl('', [Validators.required]),
      administrative_area_level_1: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      lat: new FormControl('', [Validators.required]),
      lng: new FormControl('', [Validators.required]),
    }),
  },
  list: {
    paginate: false,
    fields: 'idreg,locality,aliasLocality',
    orderBy: 'locality',
    filter: ['locality, aliasLocality'],
  }
};
