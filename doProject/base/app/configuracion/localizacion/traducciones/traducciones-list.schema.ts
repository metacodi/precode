import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const TraduccionesListSchema: EntitySchema = {
  name: 'localize_lang',
  friendly: { singular: 'traduccion', plural: 'traducciones' },
  list: {
    foreign: {
      idLocalize: { localize: '-idreg' },
      idLang: { lang: 'isoCode,langCode' },
    },
    paginate: true,
    orderBy: 'localize.path,localize.key,lang.isoCode',
    filter: {
      pipe: ['localize.path', 'localize.key', 'lang.isoCode', 'description'],
      pipeToBackend: true,
      component: 'app/configuracion/localizacion/traducciones/traducciones-search.component',
      frm: new FormGroup({
        path : new FormControl(),
        key : new FormControl(),
        idLang : new FormControl(),
      }),
    },
  }
};
