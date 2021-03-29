import { Component, Injector, OnDestroy } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscriber, Subscription } from 'rxjs';

import { environment } from 'src/environments/environment';

import { AppConfig } from 'src/core/app-config';


export interface ToastButton {
    text?: string;
    icon?: string;
    side?: 'start' | 'end';
    role?: 'cancel' | string;
    cssClass?: string | string[];
    handler?: () => boolean | void | Promise<boolean | void>;
}

export abstract class AbstractBaseClass {
  /** @hidden */
  protected debug = true && AppConfig.debugEnabled;

  /**
   * Instance of the translation service, the internationalization library (i18n) for Angular of the package `@ngx-translate`.
   * @category Dependencies
   */
  translate: TranslateService;

  /**
   * Alert controllers programmatically control the alert component.
   * @category Dependencies
   */
  alertCtrl: AlertController;

  toastCtrl: ToastController;

  constructor(
    /** @hidden */ public injector: Injector,
  ) {

    /** @category Dependencies */
    this.translate = this.injector.get<TranslateService>(TranslateService);

    /** @category Dependencies */
    this.alertCtrl = this.injector.get<AlertController>(AlertController);

    /** @category Dependencies */
    this.toastCtrl = this.injector.get<ToastController>(ToastController);

  }


  // ---------------------------------------------------------------------------------------------------
  //  showAlert
  // ---------------------------------------------------------------------------------------------------

  /**
   * Muestra un cuadro de alerta a través de AlertController.
   * - Si no se indica ningún `button` se crea uno para poderlo aceptar.
   * - Traduce todos los textos automáticamente.
   * - Docs: {@link https://ionicframework.com/docs/api/alert}
   *
   * ```typescript
   * this.showAlert({ message: 'home.welcome' }).finally(() => this.nav.pop());
   * ```
   *
   * ```typescript
   * this.showAlert({
   *   header: 'reservar.cancelarReserva',
   *   message: 'reservar.cancelarReservaMessage',
   *   YesNo: true,
   * }).then(response => {
   *   if (response) { this.nav.pop(); }
   * });
   * ```
   *
   * ```typescript
   * this.showAlert({
   *   header: 'Confirm!',
   *   message: 'Message <strong>text</strong>!!!',
   *   buttons: [
   *     {
   *       text: 'buttons.cancel',
   *       role: 'cancel',
   *       cssClass: 'secondary',
   *       handler: (blah) => {
   *         console.log('Confirm Cancel: blah');
   *       }
   *     }, {
   *       text: 'buttons.accept',
   *       handler: () => {
   *         console.log('Confirm Okay');
   *       }
   *     }
   *   ]
   * });
   * ```
   */
  showAlert(
    data: {
      header?: string,
      subHeader?: string,
      message?: string,
      cssClass?: string | string[],
      inputs?: any[],
      keyboardClose?: boolean;
      buttons?: ({
        text: string,
        role?: string,
        cssClass?: string | string[],
        handler?: (value: any) => boolean | void | { [key: string]: any },
      } | string)[],
      interpolateMessage?: any,
      YesNo?: boolean,
    },
    // options?: { interpolateMessage?: any, YesNo?: boolean },
  ): Promise<void | boolean> {
    return new Promise<void | boolean>((resolve: any, reject: any) => {
      // if (!options) { options = {}; }
      if (data.header) { data.header = this.translate.instant(data.header); }
      if (data.subHeader) { data.subHeader = this.translate.instant(data.subHeader); }
      if (data.message) { data.message = this.translate.instant(data.message, data.interpolateMessage); }
      if (data.YesNo === undefined) { data.YesNo = false; }
      if (data.buttons?.length) {
        // Si hay botones definidos forzamos el false.
        data.YesNo = false;
        // Traducimos los textos de los botones.
        data.buttons.map((button: {
          text: string,
          role?: string,
          cssClass?: string | string[],
          handler?: (value: any) => boolean | void | { [key: string]: any },
        } | string) => {
          if (typeof button === 'string') {
            button = this.translate.instant(button);
          } else {
            if (button.text) { button.text = this.translate.instant(button.text); }
          }
        });
      } else {
        if (data.YesNo) {
          // Creamos un par de botones para aceptar o rechazar.
          data.buttons = [
            { text: this.translate.instant('buttons.no'), role: 'cancel', cssClass: 'secondary', handler: () => resolve(false) },
            { text: this.translate.instant('buttons.yes'), handler: () => resolve(true) }
          ];

        } else {
          // Si no hay ningún botón declarado, creamos un botón para aceptar.
          data.buttons = [{ text: this.translate.instant('buttons.accept') }];
        }
      }
      this.alertCtrl.create(data).then(alert => {
        if (!data.YesNo) { alert.onDidDismiss().then(() => resolve()); }
        alert.present();
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  showToast Notification
  // ---------------------------------------------------------------------------------------------------

  /**
   * ```typescript
   * export interface ToastButton {
   *   text?: string;
   *   icon?: string;
   *   side?: 'start' | 'end';
   *   role?: 'cancel' | string;
   *   cssClass?: string | string[];
   *   handler?: () => boolean | void | Promise<boolean | void>;
   * }
   * ```
   *
   * Muestra un toast través de ToastController.
   * - Si no se indica ningún `button` se crea uno para poderlo aceptar.
   * - Traduce todos los textos automáticamente.
   * - Docs: {@link https://ionicframework.com/docs/api/toast}
   *
   * ```typescript
   * this.showToast({ message: 'home.welcome' }).finally(() => this.nav.pop());
   * ```
   *
   * ```typescript
   * this.showToast({
   *   header: 'reservar.cancelarReserva',
   *   message: 'reservar.cancelarReservaMessage',
   *   duration: 2000,
   * }).then(response => {
   *   if (response) { this.nav.pop(); }
   * });
   * ```
   */
  showToast(
    data: {
      header?: string,
      message?: string,
      cssClass?: string | string[],
      inputs?: any[],
      keyboardClose?: boolean;
      interpolateMessage?: any,
      duration?: number,
      position?: 'top' | 'bottom' | 'middle';
      buttons?: (ToastButton | string)[];
      icon?: string;
    },
    // options?: { interpolateMessage?: any, YesNo?: boolean },
  ): Promise<void | boolean> {
    return new Promise<void | boolean>((resolve: any, reject: any) => {
      // if (!options) { options = {}; }
      if (data.header) { data.header = this.translate.instant(data.header); }
      if (data.message) { data.message = this.translate.instant(data.message, data.interpolateMessage); }
      if (data.duration === undefined) { data.duration = 2000; }
      if (data.position === undefined) { data.position = 'top'; }
      if (data.icon === undefined) { data.icon = 'notifications'; }
      if (data.cssClass === undefined) { data.cssClass = 'toast-custom-class'; }
      if (!data.buttons?.length) {
        data.buttons = [
          {
            text: '',
            icon: data.icon,
            side: 'start'
          },
        ];
      }
      this.toastCtrl.create(data).then(toast => {
        if (!data) { toast.onDidDismiss().then(() => resolve()); }
        toast.present();
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  alertError
  // ---------------------------------------------------------------------------------------------------

  /**
   * Crea una alerta para mostrar el error en función del environment actual.
   *
   * @param message Si el `environment`actual es `production` se muestra el mensaje traducido, sino se muestra `error.message`.
   *
   * @param emitError Cuando se establece en `true` el observable devuelve `observer.error(error)` y
   * cuando se establece en `false` devuelve `observer.next(undefined)`.
   * Si no se establece ningún valor y se suministra un valor para el argumento `error` entonces `emitError` se establece en `true`.
   *
   * @param synchronously Si se establece en `true` o no se establece pero se pasa un `error`
   * entonces el observable se completa tras cerrar la alerta. En caso contrario la alerta se lanza asíncronamente
   * devolviendo la respuesta inmediatamente sin esperar a que se cierre la alerta.
   *
   * ```typescript
   * getAcciones(): Promise<any> {
   *   return this.api.post('acciones').pipe(
   *      catchError(error => this.alertError({ error, message: 'acciones.erroMessage' }))
   *   ).toPromise();
   * }
   * ```
   */
  alertError(options?: { header?: string, message?: string, interpolateParams?: any, error?: any, emitError?: boolean, synchronously?: boolean }): Observable<any> {
    if (!options) { options = {}; }
    if (options.header === undefined) { options.header = 'common.error'; }
    if (options.message === undefined) { options.message = 'common.unexpectedError'; }
    if (options.emitError === undefined) { options.emitError = !!options.error; }
    if (options.synchronously === undefined) { options.synchronously = !!options.error; }
    console.log('alertError -> environment =>', environment.production ? 'production' : 'develop');
    return new Observable<any>(observer => {

      this.alertCtrl.create({
        header: this.translate.instant(options.header),
        message: environment.production
          // Error durante producción.
          ? this.translate.instant(options.message, options.interpolateParams)
          // Error durante desarrollo.
          : (options.error?.message || JSON.stringify(options.error)),
        buttons: [{ text: this.translate.instant('buttons.accept') }],

      }).then(alert => {
        alert.onDidDismiss().finally(() => {
          if (options.synchronously) {
            if (options.emitError) { observer.error(options.error); } else { observer.next(undefined); observer.complete(); }
          }
        });
        alert.present();

      }).catch(err => {
        console.error(err);
        if (options.synchronously) {
          if (options.emitError) { observer.error(options.error); } else { observer.next(undefined); observer.complete(); }
        }
      });
      if (!options.synchronously) {
        if (options.emitError) { observer.error(options.error); } else { observer.next(undefined); observer.complete(); }
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  clone
  // ---------------------------------------------------------------------------------------------------

  /** Deep clone by recursive property iteration. */
  protected clone<T>(value: T): T | T[] {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    if (Array.isArray(value)) {
      return (value as any[]).map(v => this.clone(v));

    } else {
      const result = {};
      Object.keys(value).forEach(key => result[key] = this.clone(value[key]));
      return result as T;
    }
  }

}
