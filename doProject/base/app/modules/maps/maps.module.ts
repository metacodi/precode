import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { TranslateModule } from '@ngx-translate/core';

import { AppCoreModule } from 'src/core';
import { AuthGuard } from 'src/core/auth';

import { PickMapComponent } from './pick-map.component';
import { RouteMapComponent } from './route-map.component';
import { SearchAddressComponent } from './search-address.component';


const routes: Routes = [
  { path: 'pick-map', component: PickMapComponent, canActivate: [AuthGuard] },
  { path: 'route-map', component: RouteMapComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    TranslateModule,
    GoogleMapsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    PickMapComponent,
    RouteMapComponent,
    SearchAddressComponent,
  ],
  exports: [
    PickMapComponent,
    RouteMapComponent,
    SearchAddressComponent,
    GoogleMapsModule,
  ]
})
export class MapsModule { }
