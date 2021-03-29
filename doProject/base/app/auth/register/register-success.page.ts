import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AppConfig } from 'src/config';
import { AbstractComponent, AbstractDetailComponent } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { ThemeService } from 'src/core/util';

import { ValidateSchema } from './validate.schema';


@Component({
  selector: 'app-register-success',
  templateUrl: 'register-success.page.html',
  styleUrls: ['register-success.page.scss'],
})
export class RegisterSuccessPage extends AbstractComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  frm: FormGroup;

  constructor(
    public injector: Injector,
    public auth: AuthService,
    public route: ActivatedRoute,
    public theme: ThemeService,
  ) {
    super(injector, ValidateSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.frm = this.model.detail.frm;
  }

  ngOnInit() {
    super.ngOnInit();
    this.getRow();
  }

  getRow(): Promise<any> {
    // Llamada síncrona.
    return of(this.frm.reset({ idreg: this.route.snapshot.params.id })).toPromise();
  }

  saveRow(data?: any): Promise<any> {
    // Validamos el pin en el backend y luego navegamos hacia el login.
    return this.auth.validate(this.model.backend.plural, this.frm, { navigateToLogin: true });
  }

}
