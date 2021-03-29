import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';


export const MiPerfilGoogleMapsSchema: EntitySchema = {
  name: 'users',
  detail: {
    id: (host: any) => host.user.instant.idreg,
    frm: new FormGroup({
      idreg: new FormControl(),
      maps_zoom: new FormControl(false),
      maps_trafic: new FormControl(false),
      maps_point: new FormControl(false),
    }),
  },
};
