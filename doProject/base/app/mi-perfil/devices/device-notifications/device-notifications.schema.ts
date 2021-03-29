import { FormGroup, FormControl } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';


export const DeviceNotificationsSchema: EntitySchema = {
  name: 'deviceNotifications',
  preload: true,
  detail: {
    confirmDelete: false,
    frm: new FormGroup({
      idreg: new FormControl(),
      idUser: new FormControl(),
      idDevice: new FormControl(),
      allowChangeOptions: new FormControl(true),
      recibirCorreoReservaNueva: new FormControl(false),
      recibirCorreoReservaModificada: new FormControl(false),
      recibirCorreoReservaCancelada: new FormControl(false),
      disablePushNotifications: new FormControl(false),
      allowSonidoPush: new FormControl(false),
      sonidoPush: new FormControl(''),
    }),
  },
};
