import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';

const routes: Routes = [

];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [

  ],
  exports: [
    RouterModule,
  ],
})
export class UserModule { }
