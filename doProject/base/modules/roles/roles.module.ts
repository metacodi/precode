import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { RolesListPage } from './roles-list.page';
import { RolesListComponent } from './roles-list.component';
import { RoleDetailPage } from './role-detail.page';
import { PermissionsComponent } from './permissions/permissions.component';

const routes: Routes = [
  { path: 'role/:id', component: RoleDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
  { path: 'roles', component: RolesListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: RolesListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'prefix' }
  ]},
  { path: 'permissions', component: PermissionsComponent, canActivate: [AuthGuard], canLoad: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    RolesListPage,
    RolesListComponent,
    RoleDetailPage,
    PermissionsComponent,
  ],
  exports: [
    RouterModule,
  ],
})
export class RolesModule { }
