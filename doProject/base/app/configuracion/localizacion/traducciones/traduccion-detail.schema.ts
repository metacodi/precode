import { FormGroup, FormControl, Validators } from '@angular/forms';

import { AppConfig } from 'src/config';
import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const TraduccionDetailSchema: EntitySchema = {
  name: 'localize',
  detail: {
    foreign: {
      idLocalize: { localize_lang: '' },
    },
    // NOTA: como las entidades de detalle y de lista son diferentes, no se puede hacer la actualización automática.
    updateCacheRow: false,
    mapping: (row: any, host: any) => {
      // Añadimos las traducciones que faltan para los idiomas activos.
      AppConfig.language.available.map(lang => {
        if (!row.localize_lang.find(ll => ll.idLang === lang.idreg)) {
          row.localize_lang.push({
            idreg: 'new',
            idLang: lang.idreg,
            idLocalize: row.idreg,
            description: '',
          });
        }
      });
      return row;
    },
    saving: (row: any, host: any) => {
      row.localize_lang = row.localize_lang.filter(ll => !!ll.description);
      return row;
    },
  },
};
