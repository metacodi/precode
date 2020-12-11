import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { HomePage } from './home.page';


const routes: Routes = [
  { path: 'home', component: HomePage, canLoad: [AuthGuard], canActivate: [AuthGuard] }
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    HomePage
  ],
  exports: [
    RouterModule
  ]
})
export class HomeModule {}
