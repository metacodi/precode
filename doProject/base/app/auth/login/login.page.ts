import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Injector, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { IonInput, ModalController, Platform, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AppConfig } from 'src/config';
import { AbstractComponent } from 'src/core/abstract';
import { BlobService } from 'src/core/api';
import { AuthService, BiometricAuthService } from 'src/core/auth';
import { DevicePlugin, KeyboardPlugin, StoragePlugin, SplashScreenPlugin } from 'src/core/native';
import { LocalizationService } from 'src/core/localization';
import { ThemeService, ConsoleService, focus } from 'src/core/util';

import { VersionControlService } from 'src/modules/version-control';

import { UserService } from 'src/app/user';

import { RecoveryPage } from '../recovery/recovery.page';


@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage extends AbstractComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  @ViewChild('emailRef', { static: false }) emailRef: IonInput;
  @ViewChild('passwordRef', { static: false }) passwordRef: IonInput;
  public frm: FormGroup;
  public languageChangesSubscription: Subscription = undefined;
  public languages = AppConfig.language;


  localCredentials: any = '';
  buttonBiometricText: any = '';
  buttonBiometricIcon: any = 'finger-print';
  biometricEnabled = false;

  constructor(
    public injector: Injector,
    public router: Router,
    public modalCtrl: ModalController,
    public popoverController: PopoverController,
    public auth: AuthService,
    public user: UserService,
    public theme: ThemeService,
    public biometric: BiometricAuthService,
    public console: ConsoleService,
    public storage: StoragePlugin,
    public device: DevicePlugin,
    public keyboard: KeyboardPlugin,
    public splashScreen: SplashScreenPlugin,
    public blob: BlobService,
    public lang: LocalizationService,
    public versionControl: VersionControlService,
  ) {
    super(injector, null);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    // // Intentamos obtener una referencia al esquema a partir de su nombre.
    // const schema = this.resolveSchemaByName('LoginSchema', Model);

    // // Comprobamos si existe el esquema para el login.
    // if (schema) {
    //   // Obtenemos una instancia del modelo.
    //   this.model = new EntityModel(schema, this.translate);
    //   // Comprobamos si se ha declarado un formulario en el modelo.
    //   if (this.model.detail.frm instanceof FormGroup) {
    //     // Establecemos el formulario declarado.
    //     this.frm = this.model.detail.frm;
    //     // Establecemos el idioma por defecto.
    //     if (!this.frm.value.idLang) { this.frm.patchValue({ idLang: AppConfig.language.default.idreg }); }
    //     if (this.debug) { console.log(this.constructor.name + ' -> Usamos el formulario de model => ', this.frm.value); }
    //   }
    // }

    // Si no hemos conseguido un esquema con la info del formulario...
    if (!this.frm) {
      // Establecemos un formulario hecho a medida.
      this.frm = new FormGroup({
        // entity: new FormControl('usuarios'),
        idLang: new FormControl(AppConfig.language.default.idreg, [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      });
      if (this.debug) { console.log(this.constructor.name + ' -> Creamos un formulario => ', this.frm.value); }
      this.frm.valueChanges.subscribe(value => { this.formChanged(value); });
    }


  }


  ngOnInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnInit()'); }

    // Monitorizamos los cambios de idioma.
    this.languageChangesSubscription = this.frm.get('idLang').valueChanges.subscribe(value => {
      if (this.debug) { console.log(this.constructor.name + '.ngOnInit -> languageChangesSubscription', value); }
      // Actualizamos el idioma de la aplicación.
      this.lang.useLanguage(value);
    });

    // if (this.device.is('electron')) {
    if (!this.device.isRealPhone) {
      setTimeout(() => { this.emailRef.setFocus(); }, 500);
    }

  }

  ngOnDestroy() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnDestroy()'); }

    // Eliminamos las suscripciones.
    if (this.languageChangesSubscription) { this.languageChangesSubscription.unsubscribe(); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  credentials
  // ---------------------------------------------------------------------------------------------------

  ionViewWillEnter() {

    this.theme.checkStatusBar(this);

    // Establecemos las credenciales en el modelo.
    this.user.storeCredentialsAllowed().then(value => {
      if (value) {
        this.user.credentials().then(credentials => {
          this.frm.patchValue(credentials);
          this.localCredentials = credentials;
          if (this.debug) { console.log(this.constructor.name + '.ionViewWillEnter() -> credentials => ', credentials); }
        }).catch(error => { this.frm.patchValue({ email: '', password: '' }); });
      } else {
        // Quitamos los campos autorellenados por el navegador en versión browser.
        this.frm.patchValue({ email: '', password: '' });
      }
    });

    this.validateBiometric();
  }

  ionViewDidEnter() {
    // Ocultamos la pantalla inicial.
    // this.splashScreen.hide();
  }

  validateBiometric() {
    if (this.debug) { console.log(this.constructor.name + '.validateBiometric'); }
    this.device.ready().then(() => {
      if (this.device.isRealPhone) {
        this.biometric.enabled().then(value => {
          if (value) {
            this.biometric.getTouchType().then(tipo => {
              if (tipo) {
                if (tipo === 'FaceID') { this.buttonBiometricIcon = 'happy-outline'; }
                this.buttonBiometricText = this.translate.instant('login.scan_con', { tipo });
                this.biometricEnabled = true;
              } else {
                this.biometricEnabled = false;
              }
            });
          }
        });
      }
    });
  }

  // ---------------------------------------------------------------------------------------------------
  //  login
  // ---------------------------------------------------------------------------------------------------

  login() {
    if (this.debug) { console.log(this.constructor.name + '.login()'); }
    const data = this.frm.value;
    // Enviamos las versiones de los blobs para recibir las actualizaciones en la respuesta.
    this.auth.login(data, { blobs: 'force' }).then(user => {
      // Comprobamos si el usuario autoriza guardar las credenciales.
      if (user) {
        // Guardamos las credenciales para rellenar el formulario la próxima vez o para futuras validaciones biométricas.
        this.user.credentials(data);
      }
      // Ocultamos Teclado
      this.keyboard.hide();

    }).catch(error => {
      this.showAlert({ message: error.error.message });
    });
  }

  formChanged(value: any) {
    if (this.debug) { console.log(this.constructor.name + '.formChanged', value); }
    this.localCredentials?.email !== value.email || this.localCredentials?.password !== value.password ? this.biometricEnabled = false : this.validateBiometric();
  }

  // ---------------------------------------------------------------------------------------------------
  //  recovery
  // ---------------------------------------------------------------------------------------------------

  async recovery() {

    const pop = await this.popoverController.create({
      component: RecoveryPage,
      // event: ev,
      // cssClass: 'valoracion-popover',
      translucent: false,
      componentProps: { current: this.frm.value }
    });

    pop.onDidDismiss().then((detail) => {
      // Reseteamos el formualrio de login para limpiar errores.
        // this.frm.reset({ language: this.frm.get('language').value });
        this.frm.reset(this.frm.value);
        // Si se han devuelto datos del modal...
        if (detail && detail.data) {
          // Establecemos el correo utilizado durante la recuperación.
          this.frm.patchValue({ email: detail.data });
          // Establecemos el foco.
          focus(this.passwordRef);

        } else {
          // Establecemos el foco.
          focus(this.emailRef);
        }
    });

    pop.present();

    // // Mostramos el modal.
    // this.modalCtrl.create({
    //   component: RecoveryPage,
    //   // Pasamos el correo introducido por el usuario durante el login.
    //   componentProps: { current: this.frm.value }

    // }).then(modal => {
    //   // Al cerrar el modal...
    //   modal.onDidDismiss().then((detail: any) => {
    //     // Reseteamos el formualrio de login para limpiar errores.
    //     // this.frm.reset({ language: this.frm.get('language').value });
    //     this.frm.reset(this.frm.value);
    //     // Si se han devuelto datos del modal...
    //     if (detail && detail.data) {
    //       // Establecemos el correo utilizado durante la recuperación.
    //       this.frm.patchValue({ email: detail.data });
    //       // Establecemos el foco.
    //       focus(this.passwordRef);

    //     } else {
    //       // Establecemos el foco.
    //       focus(this.emailRef);
    //     }
    //   });
    //   // Presentamos el modal.
    //   modal.present();
    // });
  }


  contactar() {
    this.router.navigate(['contactar']);
  }

  register() {
    this.router.navigate(['register']);
  }


  // ---------------------------------------------------------------------------------------------------
  //  getters for template
  // ---------------------------------------------------------------------------------------------------

  get email() { return this.frm.controls.email; }
  get password() { return this.frm.controls.password; }
  get idLang() { return this.frm.controls.idLang; }


}
