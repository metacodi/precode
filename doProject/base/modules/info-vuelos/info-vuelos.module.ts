import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { InfoVuelosPage } from './info-vuelos.page';


const routes: Routes = [
  { path: 'info-vuelos/:direccion/:vuelo/:fecha', component: InfoVuelosPage, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    InfoVuelosPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class InfoVuelosModule { }
