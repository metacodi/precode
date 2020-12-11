import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { DeviceInfo } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';
import { ApiService, ApiUserService } from 'src/core/api';
import { StoragePlugin, DevicePlugin, FaceIdPlugin, FaceIdResponse } from 'src/core/native';
import { ConsoleService } from 'src/core/util';

import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class BiometricAuthService {
  private debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin,
    public androidFingerprintAuth: AndroidFingerprintAuth,
    public faceId: FaceIdPlugin,
    public storage: StoragePlugin,
    public api: ApiService,
    public auth: AuthService,
    public user: ApiUserService,
    public translate: TranslateService,
    public console: ConsoleService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  // Devuelve o establece si la validación biométrica está habilitada.
  enabled(value?: boolean): Promise<boolean> {
    // return of(false).toPromise();
    const key = ApiUserService.allowBiometricValidationProperty;
    return new Promise<boolean>((resolve: any, reject: any) => {
      if (value === undefined) {
        this.storage.get(key).then(stored => {
          if (this.debug) { this.console.log('BiometricAuthService -> this.storage.get(key).then: ', stored); }
          resolve(!!stored);
        }).catch(error => resolve(false));
      } else {
        this.storage.set(key, !!value).then(() => {
          if (this.debug) { this.console.log('BiometricAuthService -> this.storage.set: ', true); }
          resolve(true);
        }).catch(error => resolve(false));
      }
    });
  }

  /** Lleva a cabo la validación biométrica. Si la validación ha sido correcta devuelve las credenciales, sinó rejecta false o el error correspondiente. */
  login(): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      this.enabled().then(enabled => {
        if (this.debug) { this.console.log('BiometricAuthService -> this.enabled().then: ', enabled); }
        if (enabled) {
          this.validate().then(credentials => {
            if (this.debug) { this.console.log('BiometricAuthService -> this.validate().then: ', credentials); }
            if (credentials) { this.auth.login(credentials).then(() => resolve(true)).catch(error => reject(error)); } else { resolve(false); }

          }).catch(error => reject(error));
        } else { reject(false); }
      }, error => {
        if (this.debug) { this.console.log('BiometricAuthService -> this.enabled().then: ', error); }
        reject(error);
      });
    });
  }

  getTouchType(): Promise<string>  {
    return new Promise<any>((resolve: any, reject: any) => {
      this.device.ready().then(() => {
        this.device.getInfo().then((info: DeviceInfo) => {
          if (info.platform === 'ios') {
            this.faceId.isAvailable().then((response: { value: FaceIdResponse }) => {
              if (this.debug) { this.console.log('BiometricAuthService -> this.faceId.isAvailable().then: ', response); }
              resolve(response.value === 'None' ? undefined : (response.value === 'TouchId' ? 'TouchID' : 'FaceID'));

            }).catch(error => {
              if (this.debug) { this.console.log('BiometricAuthService -> this.faceId.isAvailable().error: ', error); }
              reject(error);
            });

          } else if (info.platform === 'android') {
            this.androidFingerprintAuth.isAvailable().then(response => {
              resolve(response.isAvailable ? 'Finger Print' : undefined);
            }).catch(error => {
              if (this.debug) { this.console.log('BiometricAuthService -> this.androidFingerprintAuth.isAvailable().error: ', error); }
              reject(error);
            });

          } else { resolve(undefined); }
        }).catch(error => reject(error));
      }).catch(error => reject(error));
    });
  }

  validate(): Promise<boolean>  {
    return new Promise<any>((resolve: any, reject: any) => {

      this.user.credentials().then(credentials => {
        if (this.debug) { this.console.log('BiometricAuthService -> this.user.credentials().then: ', credentials); }
        if (!credentials) {
          if (this.debug) { this.console.log('BiometricAuthService -> !credentials: ', false); }
          resolve(false);
        } else {
          this.device.ready().then(() => {
            this.device.getInfo().then((info: DeviceInfo) => {
              if (this.debug) { console.log(this.constructor.name + '.validate 0> info', info); }
              if (this.debug) { this.console.log('BiometricAuthService -> info.platform: ', info.platform); }
              if (info.platform === 'ios') {
                this.faceId.isAvailable().then((response: { value: FaceIdResponse }) => {
                  if (this.debug) { this.console.log('BiometricAuthService -> this.faceId.isAvailable().then: ', response); }
                  if (response.value === 'None') {
                    resolve(false);
                  } else {
                    const tipo = response.value === 'TouchId' ? 'TouchID' : 'FaceID';
                    this.faceId.auth({ reason: this.translate.instant('login.scan_con', { tipo }) }).then(() => {
                      if (this.debug) { this.console.log('BiometricAuthService -> this.faceId.verifyFingerprint().then'); }
                      resolve(credentials);

                    }).catch(error => {
                      if (this.debug) { this.console.log('BiometricAuthService -> this.faceId.verifyFingerprint().error: ', error); }
                      reject(error);
                    });
                  }
                }).catch(error => {
                  if (this.debug) { this.console.log('BiometricAuthService -> this.faceId.isAvailable().error: ', error); }
                  reject(error);
                });

              } else if (info.platform === 'android') {

                this.androidFingerprintAuth.isAvailable().then(response => {
                  if (response.isAvailable) {
                    this.androidFingerprintAuth.encrypt({
                      clientId: AppConfig.app.package,
                      username: credentials.email,
                      password: credentials.password,
                    }).then(resultFinger => {
                      resolve(resultFinger.withFingerprint || resultFinger.withBackup ? credentials : false);

                    }).catch(error => reject(error));
                  } else { resolve(false); }
                }).catch(error => reject(error));
              } else { resolve(false); }
            }).catch(error => reject(error));
          }).catch(error => reject(error));
        }
      }).catch(error => reject(error));
    });
  }

}

