import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { MapsModule } from 'src/app/modules/maps';


import { DeviceSecurityPage, DevicesListComponent, DeviceDetailPage, DevicesListPage, DeviceNotificationsPage } from './devices';
import { CalendariosListPage, CalendariosListComponent } from './calendarios';
import { MiPerfilVisualizacionPage } from './visualizacion';
import { MiPerfilGoogleMapsPage } from './google-maps';


import { MiPerfilPage } from './mi-perfil.page';
import { MiPerfilDetailPage } from './mi-perfil';
import { DevicesModule } from './devices';



const routes: Routes = [

  { path: 'mi-perfil', component: MiPerfilPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },

  { path: 'mi-perfil/detail', component: MiPerfilDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },

  { path: 'mi-perfil/calendarios', component: CalendariosListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: CalendariosListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'prefix' }
  ]},

  { path: 'mi-perfil/visualizacion', component: MiPerfilVisualizacionPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },

  { path: 'mi-perfil/google-maps', component: MiPerfilGoogleMapsPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },

];

@NgModule({
  imports: [
    AppCoreModule,
    MapsModule,
    RouterModule.forChild(routes),
    DevicesModule,

  ],
  declarations: [
    MiPerfilPage,
    MiPerfilDetailPage,
    MiPerfilVisualizacionPage,
    MiPerfilGoogleMapsPage,
    CalendariosListPage, CalendariosListComponent,
  ],
  exports: [
    RouterModule,
  ],
})
export class MiPerfilModule { }
