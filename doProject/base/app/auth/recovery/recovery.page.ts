import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { ModalController, AlertController, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from 'src/config';
import { ApiService } from 'src/core/api';
import { AuthService } from 'src/core/auth';
import { ThemeService, focus } from 'src/core/util';

import { UserService } from '../../user/user.service';


@Component ({
  selector: 'app-recovery',
  templateUrl: 'recovery.page.html',
  styleUrls: ['recovery.page.scss'],
})
export class RecoveryPage implements OnInit {
  protected debug = true && AppConfig.debugEnabled;
  frm: FormGroup = new FormGroup({});
  current: any = undefined;
  @ViewChild('email', { static: false }) emailRef: ElementRef;

  constructor(
    public translate: TranslateService,
    public modal: ModalController,
    public popover: PopoverController,
    public alert: AlertController,
    public api: ApiService,
    public user: UserService,
    public theme: ThemeService,
    public auth: AuthService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    this.frm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });

  }

  ngOnInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnInit()'); }
  }

  ionViewWillEnter() {
    if (this.debug) { console.log(this.constructor.name + '.ionViewWillEnter()'); }
    this.refresh();
  }

  ionViewDidEnter() {
    if (this.debug) { console.log(this.constructor.name + '.ionViewDidEnter()'); }
    // Establecemos el foco.
    focus(this.emailRef);
  }

  refresh() {
    // Borramos el valor anterior y sugerimos el introducido por el usuario durante el login.
    this.frm.patchValue({ email: this.current.email || '' }, { emitEvent: false });
  }

  getter(formControlName: string): any {
    // if (!this.hasOwnProperty(formControlName)) { throw new Error(`No se ha encontrado la propiedad '${formControlName}' para mapear el getter.`); }
    return this[formControlName];
  }


  // ---------------------------------------------------------------------------------------------------
  //  Password Recovery
  // ---------------------------------------------------------------------------------------------------

  recovery(frm: FormGroup) {
    // Obtenemos la entidad en función de la versión de la app.
    const entityName = 'users';
    // Combinamos la info con los datos del formulario.
    const data = Object.assign({ entity_name: entityName, language: AppConfig.language.default.idreg }, frm.value);
    // Llamada al backend.
    this.api.post('passwordRecovery', data).subscribe(response => {
      // Informamos al usuario.
      this.alert.create({
        // header: this.translate.instant('header'),
        // subHeader: this.translate.instant('subHeader'),
        message: this.translate.instant('recovery.Enviado_email'),
        buttons: [
          {
            text: this.translate.instant('buttons.accept'),
            handler: () => {
              // Cerramos el modal y devolvemos el email utilizado durante la recuperación.
              this.popover.dismiss(this.frm.get('email').value);
            }
          }
        ]
      }).then(alert => alert.present());
    });
  }



  // ---------------------------------------------------------------------------------------------------
  //  getters for template
  // ---------------------------------------------------------------------------------------------------

  get f() { return this.frm.controls; }
  get email() { return this.frm.controls.email; }


}
