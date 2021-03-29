import { Injectable, Optional, SkipSelf, OnDestroy, Injector } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { DeviceOrientationCompassHeading } from '@ionic-native/device-orientation/ngx';
import { GeolocationPosition, Plugins } from '@capacitor/core';
import { SchedulerLike, Subscription, interval, throwError, Subject, of, from, Subscriber } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { SvgIconRegistryService } from 'angular-svg-icon';
import * as moment from 'moment' ;

import { AppConfig } from 'src/config';
import { ApiService, ApiUserService, ApiUserWrapperService, BlobService } from 'src/core/api';
import { AuthService, AuthenticationState } from 'src/core/auth';
import { DevicePlugin, GeolocationPlugin, CapacitorKeepScreenOnPlugin, MotionPlugin } from 'src/core/native';
import { NotificationsService, NotifiedUser } from 'src/core/notifications';
import { ThemeService, deepAssign } from 'src/core/util';

import { ROLE_ADMIN, ROLE_CONDUCTOR, ROLE_CLIENTE, ACCION_UPDATE_PERMISSIONS } from 'src/app/model';


const { Geolocation, CapacitorKeepScreenOn } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class UserService extends ApiUserWrapperService implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /** Caché de iconos para los markers de google maps. */
  markerIcons: { [key: string]: string }[] = [];


  constructor(
    public injector: Injector,
    public service: ApiUserService,
    public popoverController: PopoverController,
    public api: ApiService,
    public auth: AuthService,
    public blob: BlobService,
    public device: DevicePlugin,
    public geolocation: GeolocationPlugin,
    public motion: MotionPlugin,
    public keepScreen: CapacitorKeepScreenOnPlugin,
    public iconReg: SvgIconRegistryService,
    public theme: ThemeService,
    public push: NotificationsService,
  ) {
    super(injector, service);
    
  }

  ngOnDestroy() {

  }

  get isAuthenticated(): boolean { return this.auth?.isAuthenticated; }


  // ---------------------------------------------------------------------------------------------------
  //  notifications
  // ---------------------------------------------------------------------------------------------------

  executeNotification(nu: NotifiedUser): void {
    switch (nu.notified.action) {
      case ACCION_UPDATE_PERMISSIONS:
        nu.processed = true;
        if (this.auth.isAuthenticated) { this.auth.refreshToken(); }
        break;
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  role del usuario
  // ---------------------------------------------------------------------------------------------------

  get isAdmin(): boolean { return this.isAbstractRole(ROLE_ADMIN); }

  get isCliente(): boolean { return this.isAbstractRole(ROLE_CLIENTE); }


  private rad2deg(value: number): number { return value * (180 / Math.PI); }
  private deg2rad(value: number): number { return value * (Math.PI / 180); }

}
