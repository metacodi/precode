import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';


export const MiPerfilVisualizacionSchema: EntitySchema = {
  name: 'visualizacion',
  detail: {
    route: 'mi-perfil-visualizacion',
    frm: new FormGroup({
      mode: new FormControl(),
      light: new FormControl(),
      dark: new FormControl(),
      statusBarVisible: new FormControl(),
    }),
  },
  // NOTA: Usamos la precarga para que no vaya a buscar la fila al backend.
  preload: true,
};
