import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { deepAssign } from 'src/core/util';


export const DashboardSettingsSchema: EntitySchema = {
  name: 'dashboardSettings',
  detail: {
    frm: new FormGroup({
      estadisticas: new FormGroup({
        show: new FormControl(false),
        groupBy: new FormControl('idPayment', [Validators.required]),
      }),
      situacionFlota: new FormGroup({
        show: new FormControl(false),
      }),
      servicios: new FormGroup({
        show: new FormControl(false),
      }),
    }),
  }
};
