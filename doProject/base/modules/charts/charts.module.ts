import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { ChartsModule as Ng2ChartsModule } from 'ng2-charts';

import { PieChartComponent } from './pie-chart.component';


@NgModule({
  imports: [
    IonicModule,
    BrowserModule,
    Ng2ChartsModule,
  ],
  declarations: [
    PieChartComponent,
  ],
  exports: [
    PieChartComponent,
  ]
})
export class ChartsModule {}
