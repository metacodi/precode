import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { DeviceNotificationsPage } from './device-notifications';
import { DeviceSecurityPage } from './device-security';
import { DeviceDetailPage } from './device-detail.page';
import { DevicesListComponent } from './devices-list.component';
import { DevicesListPage } from './devices-list.page';


const routes: Routes = [
  { path: 'notifications-settings', component: DeviceNotificationsPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
  { path: 'notifications-settings/:idDevice', component: DeviceNotificationsPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },

  { path: 'security-settings', component: DeviceSecurityPage, canActivate: [AuthGuard] },
  { path: 'security-settings/:idDevice', component: DeviceSecurityPage, canActivate: [AuthGuard] },

  { path: 'devices', component: DevicesListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: DevicesListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'prefix' }
  ]},
  { path: 'device/:id', component: DeviceDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    DeviceNotificationsPage,
    DeviceSecurityPage,
    DeviceDetailPage,
    DevicesListComponent,
    DevicesListPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class DevicesModule { }
