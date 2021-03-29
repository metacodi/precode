import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouteReuseStrategy, Routes, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Calendar } from '@ionic-native/calendar/ngx';
import { Badge } from '@ionic-native/badge/ngx';
import { NavigationBar } from '@ionic-native/navigation-bar/ngx';
import { Media } from '@ionic-native/media/ngx';
import { NgxElectronModule } from 'ngx-electron';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';
import { DeviceOrientation } from '@ionic-native/device-orientation/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { ChartsModule as ng2ChartsModule } from 'ng2-charts';

import { AppConfig } from 'src/config';
import { AppCoreModule } from 'src/core';
import { AuthGuard, AuthInterceptor, AuthService } from 'src/core/auth';
import { ConsoleService } from 'src/core/util';

import { pageTransition } from './app-transitions';


//  modules (global)
// ---------------------------------------------------------------------------------------------------
import { ChartsModule } from 'src/modules/charts';
import { ContactarModule } from 'src/modules/contactar';
import { LegalModule } from 'src/modules/legal';
import { InfoVuelosModule } from 'src/modules/info-vuelos';
import { RolesModule } from 'src/modules/roles';
import { VersionControlModule } from 'src/modules/version-control';
import { LaunchNavigatorModule } from 'src/modules/launch-navigator';
import { AngularSvgIconModule } from 'angular-svg-icon';

//  app
// ---------------------------------------------------------------------------------------------------
import { AppComponent } from 'src/app/app.component';
import { AuthModule } from 'src/app/auth';
import { HomeModule } from 'src/app/home';
import { MiPerfilModule } from 'src/app/mi-perfil';

//  modules
// ---------------------------------------------------------------------------------------------------
import { MapsModule } from 'src/app/modules/maps';
import { NotificacionesModule } from 'src/app/modules/notificaciones';
import { CalendarsModule } from 'src/app/modules/calendars';
import { PoblacionesModule } from 'src/app/modules/poblaciones';


//  configuracion
// ---------------------------------------------------------------------------------------------------
import { ConfiguracionPage } from 'src/app/configuracion';
import { LocalizacionModule } from 'src/app/configuracion/localizacion';
import { DashboardSettingsModule } from 'src/app/configuracion/dashboard';
import { UsuariosModule } from 'src/app/configuracion/usuarios';

//  user
// ---------------------------------------------------------------------------------------------------
import { UserModule, UserService } from 'src/app/user';


const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), canLoad: [AuthGuard], canActivate: [AuthGuard] },
  { path: 'config', component: ConfiguracionPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },

];


@NgModule({
  declarations: [
    AppComponent,
    ConfiguracionPage,
  ],
  imports: [
    IonicModule.forRoot({
      mode: 'ios',
      animated: true,
      navAnimation: pageTransition,
    }),
    BrowserModule,
    RouterModule.forRoot(routes, { paramsInheritanceStrategy: 'always' }),
    HttpClientModule,
    AngularSvgIconModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),
        deps: [HttpClient]
      }
    }),
    FormsModule,
    GoogleMapsModule,
    NgxElectronModule,
    ng2ChartsModule,
    AppCoreModule.forRoot(AppConfig),

    // modules (global)
    ChartsModule, ContactarModule, LegalModule, InfoVuelosModule, RolesModule, VersionControlModule, LaunchNavigatorModule,

    // app
    HomeModule,
    AuthModule,
    MiPerfilModule,

    // modules
    MapsModule, NotificacionesModule, CalendarsModule, PoblacionesModule,

    // configuracion
    LocalizacionModule, DashboardSettingsModule, UsuariosModule,

    // user
    UserModule,
  ],
  providers: [
    SplashScreen,
    InAppBrowser,
    AndroidFingerprintAuth,
    Calendar,
    Badge,
    NavigationBar,
    Media,
    CurrencyPipe,
    LaunchNavigator,
    DeviceOrientation,
    FileOpener,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true, deps: [ AuthService, ConsoleService ] },

  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
