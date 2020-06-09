#!/usr/bin/env node
/// <reference types="node" />


// --------------------------------------------------------------------------------
//  Recursos del proyecto
// --------------------------------------------------------------------------------

export const model = `
import { EntitySchema } from 'src/app/core/abstract';

export const config = {
  app: {
    name: 'app.name',
    id: 1,
  },

  debugEnabled: !environment.production,

  api: {
    url: environment.production ? 'https://dev.domain.com/api' : 'https://api.domain.com/',
  },

  language: {
    default: 'es',
    available: [
      { code: 'ca', name: 'Català' },
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'es', name: 'Español' },
    ],
  },

  // google: {
  //   maps: {
  //     key: 'AIzaSyCGOucQgyCKEjODBYuD0vukES4WVAfBoOI',
  //     defaultLocation: {
  //       // Sant Cugat
  //       lat: 41.4744074,
  //       lng: 2.0864961,
  //     }
  //   }
  // },
};
`;


export const commonModule = `
import { NgModule } from '@angular/core';
import { AppCoreModule } from 'src/app/core';

@NgModule({
  imports: [
    AppCoreModule,
  ],
  declarations: [
  ],
  entryComponents: [
  ],
  exports: [
    AppCoreModule,
  ]
})
export class AppCommonModule { }
`;


export const commonService = `
import { Injectable, Injector, OnDestroy } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { environment } from 'src/environments/environment';
import { ApiService } from 'src/app/core/api';
import { AuthService, AuthAction } from 'src/app/global/auth/auth.service';
import { AbstractModelService, EntitySchema } from 'src/app/core/abstract';
// import { MiPerfilSchema } from '../model';


@Injectable({
  providedIn: 'root'
})
export class AppCommonService extends AbstractModelService implements OnDestroy {
  protected debug = true && environment.debugEnabled;

  schemas: EntitySchema[] = [
    // MiPerfilSchema,
  ];

  // profile: any;

  authSubscription: Subscription;

  constructor(
    protected injector: Injector,
    protected api: ApiService,
    private auth: AuthService,
    private sanitizer: DomSanitizer,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    // Monitorizamos la autenticación para obtener el perfil del usuario validado.
    this.authSubscription = this.auth.authenticationChanged.subscribe((data: { isAuthenticated: boolean, user: any, action: AuthAction }) => {
      if (this.debug) { console.log(this.constructor.name + '.constructor() -> authenticationChanged.subscribe(data)', data); }
      if (data.isAuthenticated) {
        // // Obtenemos el perfil del usuario.
        // this.getRow(this, 'usuario', data.user.idreg).subscribe(profile => {
        //   // Mapeamos el teléfono.
        //   profile.telefono = profile.telf1;
        //   // Referenciamos el perfil.
        //   this.profile = profile;
        // });

      } else {
        // // Limpiamos la info del perfil.
        // this.profile = null;
      }
    });
  }

  ngOnDestroy() {
    // Dejamos de monitorización la autenticación.
    if (this.authSubscription) { this.authSubscription.unsubscribe(); }
  }

  colorMatch(text: string, match: string) {
    if (!match || !text) { return text; }
    const value = text.replace(new RegExp('(' + match + ')', 'ig'), '<span class="filtered">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
`;

export const homeRoutes = `
/** Home */
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './modules/home/home.module', canLoad: [AuthGuard], canActivate: [AuthGuard] },
];
`;

export const HomeModule = `
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCommonModule } from 'src/app/global/app-common.module';
import { AuthGuard } from 'src/app/modules/auth/auth.guard';

import { HomePage } from './home.page';

const routes: Routes = [
  { path: 'home', component: HomePage, canLoad: [AuthGuard], canActivate: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCommonModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    HomePage,
  ],
  exports: [
    RouterModule,
  ],
  providers: [

  ],
})
export class HomeModule {}
`;

export const HomePageTS = `
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from 'src/environments/environment';
import { AppCommonService } from 'src/app/global/app-common.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  private debug = true && environment.debugEnabled;

  constructor(
    private translate: TranslateService,
    private app: AppCommonService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }
}
`;

export const Fonts = `
/*
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: normal;
  src: url('../assets/fonts/Lato-Regular.ttf');
}
@font-face {
  font-family: 'Lato';
  font-style: italic;
  font-weight: normal;
  src: url('../assets/fonts/Lato-Italic.ttf');
}
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: bold;
  src: url('../assets/fonts/Lato-Bold.ttf');
}
@font-face {
  font-family: 'Lato';
  font-style: italic;
  font-weight: bold;
  src: url('../assets/fonts/Lato-BoldItalic.ttf');
}
*/
`;
