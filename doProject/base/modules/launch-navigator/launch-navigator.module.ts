import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { LaunchNavigatorPage } from './launch-navigator.page';


const routes: Routes = [
  { path: 'launch-navigator', component: LaunchNavigatorPage, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    LaunchNavigatorPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class LaunchNavigatorModule { }
