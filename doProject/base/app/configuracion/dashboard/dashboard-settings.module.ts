import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { DashboardSettingsComponent } from './dashboard-settings.component';


const routes: Routes = [
  { path: 'dashboard-settings', component: DashboardSettingsComponent, canActivate: [AuthGuard], canLoad: [AuthGuard]},

];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    DashboardSettingsComponent,
  ],
  exports: [
    RouterModule,
  ],
})
export class DashboardSettingsModule { }
