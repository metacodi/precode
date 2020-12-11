import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppCoreModule } from 'src/core';

import { ContactarPage } from './contactar.page';


const routes: Routes = [
  { path: 'contactar', component: ContactarPage }
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ContactarPage]
})
export class ContactarModule {}
