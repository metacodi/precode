import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { NotificacionesListPage } from './notificaciones-list.page';
import { NotificacionesListComponent } from './notificaciones-list.component';


const routes: Routes = [
  { path: 'notificaciones', component: NotificacionesListPage, canActivate: [AuthGuard], children: [
    { path: 'list', component: NotificacionesListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'prefix' }
  ]},
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    NotificacionesListPage,
    NotificacionesListComponent,
  ],
  exports: [
    RouterModule,
  ],
})
export class NotificacionesModule { }
