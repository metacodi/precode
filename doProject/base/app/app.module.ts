import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, Routes, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Calendar } from '@ionic-native/calendar/ngx';
import { NgxElectronModule } from 'ngx-electron';

import { AppConfig } from 'src/config';
import { AppCoreModule } from 'src/core';
import { AuthGuard, AuthInterceptor, AuthService } from 'src/core/auth';
import { ConsoleService } from 'src/core/util';

import { pageTransition } from './app-transitions';


//  modules (global)
// ---------------------------------------------------------------------------------------------------
import { ContactarModule } from 'src/modules/contactar';
import { LegalModule } from 'src/modules/legal';
import { InfoVuelosModule } from 'src/modules/info-vuelos';
import { RolesModule } from 'src/modules/roles';
import { VersionControlModule } from 'src/modules/version-control';

//  app
// ---------------------------------------------------------------------------------------------------
import { AppComponent } from 'src/app/app.component';
import { AuthModule } from 'src/app/auth';
import { HomeModule } from 'src/app/home';




const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), canLoad: [AuthGuard], canActivate: [AuthGuard] },
];


@NgModule({
  declarations: [
    AppComponent,
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
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', '.json'),
        deps: [HttpClient]
      }
    }),
    FormsModule,
    NgxElectronModule,
    AppCoreModule.forRoot(AppConfig),

    // modules (global)
    ContactarModule, LegalModule, InfoVuelosModule, RolesModule, VersionControlModule,

    // app
    HomeModule,
    AuthModule,
  ],
  providers: [
    SplashScreen,
    InAppBrowser,
    AndroidFingerprintAuth,
    Calendar,
    CurrencyPipe,
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
