import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { catchError } from 'rxjs/operators';

import { AppConfig } from 'src/config';
import { AbstractBaseClass } from 'src/core/abstract';
import { ApiService } from 'src/core/api';
import { AuthService } from 'src/core/auth';


@Injectable({
  providedIn: 'root'
})
export class InfoVuelosService extends AbstractBaseClass  {
  protected debug = true && AppConfig.debugEnabled;

  preloadedRow: undefined;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public auth: AuthService,
    public router: Router,
    public nav: NavController,
  ) {
    super(injector);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  async navigate(direccion: 'arr' | 'dep', vuelo: string, fecha: string, host?: any): Promise<any> {

    // Establecemos el indicador de estado.
    if (host) { host.preloading = true; }

    // Realizamos la precarga de la info de vuelo.
    return this.api.get(`flightStats?direccion=${direccion}&vuelo=${vuelo}&fecha=${fecha}`).pipe(
      catchError(error => this.alertError({ error, message: 'infoVuelo.genericError' }))
    ).toPromise().then(response => {
      if (this.debug) { console.log(this.constructor.name + 'getInfoVuelo() -> response => ', response); }

      // Establecemos la fila precargada en el servicio.
      this.preloadedRow = response;
      // Navegamos hacia el componente de detalle y restablecemos el indicador de estado.
      this.nav.setDirection('forward');
      return this.router.navigate([`info-vuelos/`, direccion, vuelo, fecha]).finally(() => { if (host) { host.preloading = false; }});
    });
  }

}
