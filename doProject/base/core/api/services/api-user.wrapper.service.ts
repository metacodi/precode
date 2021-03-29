import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from 'src/config';

import { AbstractBaseClass } from '../../abstract/abstract-base.class';

import { ApiUserService } from './api-user.service';


@Injectable({
  providedIn: 'root'
})
export class ApiUserWrapperService extends AbstractBaseClass {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: ApiUserService,
  ) {
    super(injector);
  }


  // ---------------------------------------------------------------------------------------------------
  //  ApiUserService wrapper
  // ---------------------------------------------------------------------------------------------------

  get instant(): any { return this.service.instant; }

  get idreg(): 'new' | number { return this.service.idreg; }

  get(): Observable<any> { return this.service.get(); }

  async set(user: any): Promise<any> { return this.service.set(user); }

  remove(): Promise<any> { return this.service.remove(); }

  storeDevice(device: any): Promise<any> { return this.service.storeDevice(device); }

  credentials(value?: any): Promise<any> { return this.service.credentials(value); }

  storeCredentialsAllowed(): Promise<boolean> { return this.service.storeCredentialsAllowed(); }

  biometricValidationAllowed(): Promise<boolean> { return this.service.biometricValidationAllowed(); }

  resolveToken(user: any): string { return this.service.resolveToken(user); }

  hasPermission(permission: string): boolean { return this.service.hasPermission(permission); }

  isAbstractRole(idRole?: number | number[]) { return this.service.isAbstractRole(idRole); }

}
