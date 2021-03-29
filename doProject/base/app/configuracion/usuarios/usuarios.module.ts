import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { UsuariosListPage } from './usuarios-list.page';
import { UsuariosListComponent } from './usuarios-list.component';
import { UsuarioDetailPage } from './usuario-detail.page';


const routes: Routes = [
  { path: 'usuarios', component: UsuariosListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: UsuariosListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'full' }
  ]},
  { path: 'usuario/:id', component: UsuarioDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    UsuariosListPage,
    UsuariosListComponent,
    UsuarioDetailPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class UsuariosModule { }
