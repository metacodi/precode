import { Injectable, EventEmitter, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { ApiRequestOptions, API_ERR_VALIDATION_PENDENT, ApiUserService, ApiService } from 'src/core/api';
import { DevicePlugin } from 'src/core/native';
import { ConsoleService } from 'src/core/util';

import { EntityName } from '../abstract/model/entity-model';
import { EntityType } from '../abstract/model/entity-schema';
import { NavigationOptions } from '@ionic/angular/providers/nav-controller';


export type AuthAction = 'login' | 'logout' | 'refresh' | 'register';

export interface AuthenticationState { isAuthenticated: boolean; user: any; action: AuthAction; }

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  protected debug = true && AppConfig.debugEnabled;

  isAuthenticated = false;
  authenticationChanged: EventEmitter<AuthenticationState>;

  constructor(
    public api: ApiService,
    public router: Router,
    public translate: TranslateService,
    public nav: NavController,
    public user: ApiUserService,
    public device: DevicePlugin,
    public console: ConsoleService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    // Instanciamos un nuevo emisor de eventos para notificar login y logout.
    this.authenticationChanged = new EventEmitter<AuthenticationState>();
  }


  // ---------------------------------------------------------------------------------------------------
  //  login . logout
  // ---------------------------------------------------------------------------------------------------

  login(data: any, options?: { navigate?: boolean, showLoader?: boolean, blobs?: ApiRequestOptions['blobs'] }): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!options) { options = {}; }
      if (options.navigate === undefined) { options.navigate = true; }
      if (options.showLoader === undefined) { options.showLoader = false; }

      this.device.getInfo().then(device => {
        // Añadimos la info del dispositivo.
        data.device = device;

        this.api.post('login', data, options).subscribe(user => {
          if (this.debug) { this.console.log(this.constructor.name + '.login().subscribe(user) => ', user); }
          // Validamos al usuario.
          this.doLogin(user, 'login').subscribe(results => {
            if (options.navigate) {
              if (this.debug) { console.log(this.constructor.name + '.navigateBack => /home'); }
              this.nav.navigateForward(['/home'], { replaceUrl: true });
            }
            resolve(user);
          });
        }, error => {
          if (this.debug) { this.console.log(this.constructor.name + '.login().subscribe(error) => ', error); }
          // Si está pendiente de validación, lo redireccionamos como si acabase de registrase.
          if (error?.error?.api_code === API_ERR_VALIDATION_PENDENT ) {
            this.router.navigate(['/register-success', error.error.idreg]);
            resolve();
          } else {
            // NOTA: Para el resto de errores de login no navegamos, nos quedamos en la misma página.
            reject(error);
          }
        });

      }).catch(error => reject(error));
    });
  }

  logout(options?: { navigateToLogin?: boolean }): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!options) { options = {}; }
      if (options.navigateToLogin === undefined) { options.navigateToLogin = true; }
      // Establecemos el indicador de estado.
      this.isAuthenticated = false;
      // Lalamada al backend.
      this.api.get('logout').subscribe(() => {}, error => {
        if (this.debug) { this.console.log(this.constructor.name + '.logout().subscribe(error) => ', error); }
      }, () => {
          // Eliminamos el user
        this.user.remove().then(() => {
          // Notificamos el evento.
          this.onAuthenticationChanged('logout');
          // Navegamos al login.
          if (options.navigateToLogin) {
            this.nav.navigateRoot(['/login'], { animated: true, animationDirection: 'back' }).finally(() => resolve()); } else { resolve();
            }

        }).catch(error => reject(error));
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  canNavigate
  // ---------------------------------------------------------------------------------------------------

  canNavigate(url: string): Promise<boolean> {
    // Fabricamos una promesa para su uso con 'await' en funciones 'async'.
    return new Promise((resolve, reject) => {
      // Comprobamos si ya está validado.
      if (this.isAuthenticated) {
        if (this.debug) { console.log(this.constructor.name + '.canNavigate() => isAuthenticated!'); }
        resolve(true);

      } else {
        if (this.debug) { console.log(this.constructor.name + '.canNavigate() => not isAuthenticated!'); }
        // Intentamos auto-validar refrescando el token.
        this.refreshToken().subscribe((token: any) => {
          if (this.debug) { this.console.log(this.constructor.name + '.canNavigate => refreshToken().then(token) =', token); }
          resolve(!!token);

        }, error => {
          if (this.debug) { this.console.log(this.constructor.name + '.canNavigate => refreshToken().error(error) =', error); }
          this.logout();
          resolve(false);
        });
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  getToken . refreshToken
  // ---------------------------------------------------------------------------------------------------

  getToken(): Observable<any> {
    if (this.debug) { console.log(this.constructor.name + '.getToken()'); }
    return new Observable<any>(observer => {

      this.user.get().subscribe(stored => {
        observer.next(this.user.resolveToken(stored));
        observer.complete();

      }, error => observer.error(error));
    });
  }


  refreshToken(): Observable<any> {
    if (this.debug) { console.log(this.constructor.name + '.refreshToken()'); }
    return new Observable<any>(observer => {

      this.getToken().subscribe(token => {
        if (token) {
          if (this.debug) { this.console.log(this.constructor.name + '.refreshToken() -> token => '); }
          const data = { token };
          // Intentamos obtener un nuevo token del backend.
          this.api.post('refreshToken', data, { showLoader: false, showErrors: false }).subscribe(response => {
            // NOTA: No se prevee el error api 493 Pendiente de validación porque refreshToken() solo se llama
            // si el usuario se encuentra en una área restringida a la que no podría haber llegado sin estar validado.
            this.doLogin(response, 'refresh').subscribe(
              user => observer.next(this.user.resolveToken(user)),
              error => observer.error(error), () => observer.complete()
            );
          }, error => observer.error(error));

        } else {
          if (this.debug) { console.log(this.constructor.name + '.refreshToken() => false'); }
          observer.error('Invalid token');
        }
      }, error => observer.error(error));
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  doLogin . onAuthenticationChanged
  // ---------------------------------------------------------------------------------------------------

  doLogin(user: any, action: AuthAction): Observable<any> {
    if (this.debug) { console.log(this.constructor.name + '.doLogin', user); }
    // Establecemos el indicador de estado.
    this.isAuthenticated = true;
    // Notificamos a los suscriptores.
    return new Observable(observer => {
      // Almacenamos el usuario.
      this.user.set(user).then(() => {
        // Notificamos el evento.
        this.onAuthenticationChanged(action);
        // Notificamos a los suscriptores.
        observer.next(user);

      }).catch(() => observer.next(user)).finally(() => observer.complete());
    });
  }

  private onAuthenticationChanged(action: AuthAction): void {
    // Obtenemos el usuario del storage.
    this.user.get().pipe(first()).subscribe(user => {
      // Notificamos a los suscriptores el estado de autenticación.
      this.authenticationChanged.emit({ isAuthenticated: this.isAuthenticated, user, action });
      if (this.debug) { this.console.log('AuthService -> authenticationChanged => ', action); }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  register
  // ---------------------------------------------------------------------------------------------------

  register(entity: string | EntityType, value: any): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // Obtenemos el nombre de la entidad para la url.
      const url = EntityName.resolve(entity).plural;
      // Obtenemos los datos.
      if (value instanceof FormGroup) { value = (value as FormGroup).value; }
      // Desagrupamos y quitamos las propiedades innecesarias
      const { confirm, aceptoCondiciones, ...data } = (this.api.unGroupData(value) as any);
      // Enviamos el formulario.
      this.api.post(url, data).subscribe(row => {
        if (this.debug) { this.console.log('register SUCCESS => ', row); }
        this.router.navigate(['/register-success', (row as any).idreg ]);
        resolve(true);
        // ---------------------------------------------------------------------------------------------------
        // NOTA: La validación se produce en `register-success` tras introducir el pin de validación.
        // ---------------------------------------------------------------------------------------------------
        // // Validamos al usuario.
        // this.doLogin(row, 'register').subscribe(user => {
        //   // Navigate to the login page with extras
        //   this.router.navigate(['/home']);
        // });
        // ---------------------------------------------------------------------------------------------------
      }, error => {
        if (this.debug) { this.console.log('Register Error => ', error); }
        resolve(false);
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  validate
  // ---------------------------------------------------------------------------------------------------

  validate(entity: string | EntityType, value: any, options?: { navigateToLogin?: boolean }): Promise<boolean> {
    if (!options) { options = {}; }
    if (options.navigateToLogin === undefined) { options.navigateToLogin = true; }
    return new Promise<boolean>((resolve, reject) => {
      // Obtenemos el nombre de la entidad para la url.
      const url = EntityName.resolve(entity).plural;
      // Obtenemos los datos.
      if (value instanceof FormGroup) { value = (value as FormGroup).value; }
      // Enviamos el formulario.
      this.api.post(url, value).subscribe(row => {
        if (this.debug) { console.log(this.constructor.name + '.validate() => valid'); }
        if (options.navigateToLogin) { this.router.navigate(['/login'], ); }
        resolve(true);
      }, error => {
        if (this.debug) { console.log(this.constructor.name + '.validate() => invalid'); }
        resolve(false);
      });
    });
  }

}
