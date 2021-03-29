import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { PoblacionesListPage } from './poblaciones-list.page';
import { PoblacionesListComponent } from './poblaciones-list.component';
import { PoblacionDetailPage } from './poblacion-detail.page';


const routes: Routes = [
  { path: 'poblaciones', component: PoblacionesListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: PoblacionesListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'full' }
  ]},
  { path: 'poblacion/:id', component: PoblacionDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    PoblacionesListPage,
    PoblacionesListComponent,
    PoblacionDetailPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class PoblacionesModule { }
