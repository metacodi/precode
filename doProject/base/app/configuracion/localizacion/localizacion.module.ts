import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { IdiomasListPage, IdiomasListComponent, IdiomaDetailPage } from './idiomas';
import { TraduccionesListPage, TraduccionesListComponent, TraduccionDetailPage, TraduccionesSearchComponent } from './traducciones';


const routes: Routes = [
  { path: 'lang', component: IdiomasListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: IdiomasListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'full' }
  ]},
  { path: 'lang/:id', component: IdiomaDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
  { path: 'traducciones', component: TraduccionesListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: TraduccionesListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'full' }
  ]},
  { path: 'traduccion/:id', component: TraduccionDetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
];


@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    IdiomasListPage,
    IdiomasListComponent,
    IdiomaDetailPage,
    TraduccionesListPage,
    TraduccionesListComponent,
    TraduccionDetailPage,
    TraduccionesSearchComponent,
  ],
  exports: [
    RouterModule,
  ],
})
export class LocalizacionModule { }
