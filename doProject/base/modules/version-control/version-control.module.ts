import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { VersionControlPage } from './version-control.page';


const routes: Routes = [
  { path: 'version-control', component: VersionControlPage },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    VersionControlPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class VersionControlModule { }
