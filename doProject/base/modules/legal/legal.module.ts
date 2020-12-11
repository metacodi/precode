import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { LegalPage } from './legal.page';


const routes: Routes = [
  { path: 'legal', component: LegalPage },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    LegalPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class LegalModule { }
