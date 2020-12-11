import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Injector } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { ApiService, ApiUserService } from 'src/core/api';
import { AuthService } from 'src/core/auth';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/auth';

import { ContactarSchema } from './contactar.schema';
import { ContactarService } from './contactar.service';


@Component({
  selector: 'app-contactar',
  templateUrl: './contactar.page.html',
  styleUrls: ['./contactar.page.scss'],
})
export class ContactarPage extends AbstractDetailComponent implements OnInit, OnDestroy  {
  protected debug = true && AppConfig.debugEnabled;
  @ViewChild('focusRef', { static: false }) focusRef: ElementRef;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public auth: AuthService,
    public theme: ThemeService,
    public user: UserService,
    public service: ContactarService,
  ) {
    super(injector, ContactarSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  ngOnInit() {
    super.ngOnInit();
    // Intentamos establecer los datos del usuario en el formulario de contacto.
    this.user.get().subscribe(user => this.frm.patchValue(user || {}) );
  }

  // NOTA: Sobrescribimos el método para evitar la llamada al servicio abstarcto,
  // que tras guardar la fila intentaría cargar una hipotética entidad de datos que no existe.
  saveRow(data?: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.api.post('contactar', this.frm.value).subscribe(() => {
        this.showAlert({ message: 'contactar.mensaje_enviado_correctamente' }).finally(() => this.nav.pop());
        // this.alertCtrl.create({
        //   message: this.translate.instant('contactar.mensaje_enviado_correctamente'),
        //   buttons: [{
        //     text: this.translate.instant('buttons.accept'),
        //     handler: () => this.nav.pop()
        //   }]
        // });
      });
    });
  }

}
