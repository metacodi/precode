import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';

import { LoginPage } from './login/login.page';
import { RecoveryPage } from './recovery/recovery.page';
import { RegisterPage, RegisterSuccessPage, RegisterTermsPage } from './register';
import { EstadoConductorComponent } from './estado-conductor/estado-conductor.component';


const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'register-terms', component: RegisterTermsPage },
  { path: 'register-success/:id', component: RegisterSuccessPage },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
    // IonicStorageModule.forRoot(),
  ],
  declarations: [
    LoginPage,
    RecoveryPage,
    RegisterPage,
    RegisterTermsPage,
    RegisterSuccessPage,
    EstadoConductorComponent,
  ],
  exports: [
    RouterModule,
  ],
})
export class AuthModule { }
