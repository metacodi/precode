import { Injectable, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AppConfig } from 'src/core/app-config';
import { StoragePlugin } from 'src/core/native';
import { deepAssign } from 'src/core/util';


/**
 * Gestiona el usuario de la api en el storage.
 * Mantiene una referencia que funciona como una caché.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiUserService {

  /** Nombre de la propiedad que autoriza guardar las credenciales. */
  public static allowStoreCredentialsProperty = 'allowStoreCredentials';
  /** Nombre de la propiedad para la autorización de la validación biométrica. */
  public static allowBiometricValidationProperty = 'allowBiometricValidation';

  protected debug = true && AppConfig.debugEnabled;

  get instant(): any { return this.user; }
  private user: any = undefined;

  constructor(
    // public injector: Injector,
    public storage: StoragePlugin,
  ) {
    // super(injector);
  }


  get idreg(): 'new' | number {
    if (this.user?.idreg) { return this.user.idreg; }
    return 'new';
  }

  get(): Observable<any> {
    return new Observable<any>(observer => {
      // Si se ha establecido la variable la devolvemos.
      if (this.instant) {
        if (this.debug) { console.log(this.constructor.name + '.get => of(this.instant)', this.instant); }
        // Devolvemos el usuario actual.
        observer.next(this.instant);
        observer.complete();

      } else {
        // Intentamos obtener un user almacenado.
        this.storage.get('api_user').then(user => {
          if (this.debug) { console.log(this.constructor.name + '.get.then => ', user); }
          // Establecemos la variable.
          this.user = user;
          // Resolvemos.
          observer.next(user);
          observer.complete();

        }).catch(error => {
          if (this.debug) { console.log(this.constructor.name + '.get.catch => ', error); }
          // Resolvemos negativamente.
          observer.next(null);
          observer.complete();
        });
      }
    });
  }

  async set(user: any): Promise<any> {
    if (this.debug) { console.log(this.constructor.name + '.set() => ', user); }
    // Establecemos la variable.
    this.user = user;
    // Guardamos la info de validació en claves separadas para recuperarlas durante el login (no disponemos de api_user)
    this.storage.set(ApiUserService.allowStoreCredentialsProperty, !!user.device.security[ApiUserService.allowStoreCredentialsProperty]);
    this.storage.set(ApiUserService.allowBiometricValidationProperty, !!user.device.security[ApiUserService.allowBiometricValidationProperty]);
    // Almacenamos el user.
    return this.storage.set('api_user', user).then(() => user);
  }

  remove(): Promise<any> {
    if (this.debug) { console.log(this.constructor.name + '.remove()'); }
    // Limpiamos la variable.
    this.user = undefined;
    // Quitamos el user del almacén.
    return this.storage.remove('api_user');
  }

  storeDevice(device: any): Promise<any> {
    if (this.debug) { console.log(this.constructor.name + '.storeDevice() => ', device); }
    return new Promise<any>((resolve: any, reject: any) => {
      this.get().subscribe(user => {
        if (!user) { reject('User is undefined!'); }
        // Actualizamos el dispositivo del usuario.
        user.device = deepAssign(user.device, device);
        // Guardamos el usuario en el storage.
        this.set(user);
      });
    });
  }

  credentials(value?: any): Promise<any> {
    if (!value) {
      // Obtenemos las credenciales del almacén.
      return this.storage.get('user_credentials');

    } else {
      if (this.debug) { console.log(this.constructor.name + '.credentials(value) => ', value); }
      // Almacenamos las credenciales.
      return this.storage.set('user_credentials', value);
    }
  }

  storeCredentialsAllowed(): Promise<boolean> {
    if (this.debug) { console.log(this.constructor.name + '.storeCredentialsAllowed()'); }
    return this.storage.get(ApiUserService.allowStoreCredentialsProperty);
  }

  biometricValidationAllowed(): Promise<boolean> {
    if (this.debug) { console.log(this.constructor.name + '.biometricValidationAllowed()'); }
    return this.storage.get(ApiUserService.allowBiometricValidationProperty);
  }

  resolveToken(user: any): string {
    return user ? user.apiToken || user.token || (user.device ? user.device.apiToken || '' : '') : '';
  }

  /**
   * Comprueba si el usuario actual tiene el permiso indicado.
   * ```typescript
   * if (this.user.hasPermission('facturas.print.listado')) { ... }
   * ```
   *
   * Esta función debe utilizarse únicamente para hacer comprobaciones programáticas. Para comprobar permisos
   * en los _templates_ utilizar la directiva `HasPermissionDirective`:
   * ```html
   * <ion-button hasPermission="facturas.print.listado">Imprimir</ion-button>
   * ```
   *
   * @param permission Nombre completo del permiso, por ejemplo: "facturas.print.listado"
   */
  hasPermission(permission: string): boolean {
    if (!this.user) { return false; }
    const permissions: string[] = this.user.permissions;
    return Array.isArray(permissions) && permissions.includes(permission);
  }

  /** Comprueba si el usuario actual pertenece a uno de los roles indicados.
   * ```typescript
   * if (this.user.isAbstractRole([ ROLE_ADMIN, ROLE_CONDUCTOR ])) { ... }
   * ```
   */
  isAbstractRole(idRole?: number | number[]) {
    // if (this.debug) { console.log(this.constructor.name + '.isAbstractRole() -> user', this.user); }
    // if (this.debug) { console.log(this.constructor.name + '.isAbstractRole() -> instant', this.instant); }
    if (!this.user) { return false; }
    const roles = Array.isArray(idRole) ? idRole : [idRole];
    return roles.some(r => r === this.user.idAbstractRole);
  }

}
