import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, ActivatedRouteSnapshot } from '@angular/router';
import { Router, Route, RouterStateSnapshot } from '@angular/router';

import { AppConfig } from 'src/core/app-config';

import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private debug = true && AppConfig.debugEnabled;

  constructor(
    public router: Router,
    public auth: AuthService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (this.debug) { console.log(this.constructor.name + '.canActivate() => ', { url: state.url, router: this.router, route, state }); }
    return await this.auth.canNavigate(state.url);
  }

  async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (this.debug) { console.log(this.constructor.name + '.canActivateChild() => ', { url: state.url, router: this.router, route, state }); }
    return this.canActivate(route, state);
  }

  async canLoad(route: Route): Promise<boolean> {
    if (this.debug) { console.log(this.constructor.name + '.canLoad()', { url: route.path, router: this.router, route }); }
    return await this.auth.canNavigate(route.path);
  }

}
