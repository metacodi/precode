import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule } from 'src/core';

import { CalendarsListComponent } from './calendars-list.component';


const routes: Routes = [];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    CalendarsListComponent,
  ],
  exports: [
    RouterModule,
    CalendarsListComponent,
  ],
})
export class CalendarsModule { }
