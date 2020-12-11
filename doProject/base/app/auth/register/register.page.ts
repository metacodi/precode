import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Injector } from '@angular/core';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators, AbstractControl} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from 'src/config';
import { EntityModel } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { ThemeService } from 'src/core/util';

import { RegisterSchema } from './register.schema';


@Component ({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
})
// export class RegisterPage extends AbstractDetailComponent implements OnInit, OnDestroy {
export class RegisterPage {
// export class RegisterPage  {
  protected debug = true && AppConfig.debugEnabled;
  @ViewChild('focusRef', { static: false }) focusRef: ElementRef;

  model: EntityModel;
  frm: FormGroup;
  submitted = false;

  constructor(
    public injector: Injector,
    public auth: AuthService,
    public theme: ThemeService,
    public modal: ModalController,
    public router: Router,
    public alert: AlertController,
    public translate: TranslateService,
  ) {
    // super(injector, RegisterSchema, AuthService);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    // Creamos una instancia para el modelo.
    this.model = new EntityModel(RegisterSchema);
    // Referenciamos el formulario
    this.frm = this.model.detail.frm;
  }

  saveRow() {
    // Establecemos el indicador de estado.
    this.submitted = true;
    // Ahora sí mostramos el mensaje de error.
    if (this.aceptoCondiciones.value) {
      // Enviamos el registro al backend.
      this.auth.register(this.model.backend.plural, this.frm).then(response => {
        if (response) {
          this.alert.create({
            header: this.translate.instant('register.success'),
            message: this.translate.instant('register.check_your_email'),
            buttons: [{
              text: this.translate.instant('buttons.accept'),
              // handler: () => this.router.navigate(['/login']),
            }]
          }).then(alert => { alert.present(); });
        }
      });
    }
  }

  ionViewWillEnter() {
    this.theme.checkStatusBar(this);
  }

  verCondiciones() {
    this.router.navigate(['/register-terms']);
  }

  getter(formControlName: string): any {
    // if (!this.hasOwnProperty(formControlName)) { throw new Error(`No se ha encontrado la propiedad '${formControlName}' para mapear el getter.`); }
    return this[formControlName];
  }

  // ---------------------------------------------------------------------------------------------------
  //  getters for template
  // ---------------------------------------------------------------------------------------------------

  get nombre(): FormControl { return this.frm.controls.nombre as FormControl; }
  get apellidos(): FormControl { return this.frm.controls.apellidos as FormControl; }
  get telefono(): FormControl { return this.frm.controls.telefono as FormControl; }
  get email(): FormControl { return this.frm.controls.email as FormControl; }
  get passwords(): FormGroup { return this.frm.controls.passwords as FormGroup; }
  get password(): FormControl { return this.passwords.controls.password as FormControl; }
  get confirm(): FormControl { return this.passwords.controls.confirm as FormControl; }
  get aceptoCondiciones(): FormControl { return this.frm.controls.aceptoCondiciones as FormControl; }

}

