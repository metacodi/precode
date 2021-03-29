import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema } from 'src/core/abstract';
import { MatchValidator } from 'src/core/util';


export const DeviceSecuritySchema: EntitySchema = {
  name: 'deviceSecurity',
  preload: true,
  detail: {
    confirmDelete: false,
    flatRow: true,
    frm: new FormGroup({
      passwords: new FormGroup({
        password: new FormControl('', [Validators.minLength(6)]),
        confirm: new FormControl('', [Validators.minLength(6)]),
      }, MatchValidator),
      idreg: new FormControl(),
      idUser: new FormControl(),
      idDevice: new FormControl(),
      allowChangeOptions: new FormControl(true),
      allowStoreCredentials: new FormControl(),
      allowBiometricValidation: new FormControl(),
      sendEmailOnNewDevice: new FormControl(),
      sendPushOnNewDevice: new FormControl(),
      sendEmailOnChangeIp: new FormControl(),
      sendPushOnChangeIp: new FormControl(),
    }),
  },
};
