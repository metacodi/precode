import { Component, OnInit, ElementRef, ViewChild, Injector, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from 'src/config';
import { AuthService } from 'src/core/auth';
import { ThemeService } from 'src/core/util';


@Component ({
  selector: 'app-register-terms',
  templateUrl: 'register-terms.page.html',
  styleUrls: ['register-terms.page.scss'],
})
export class RegisterTermsPage {
  protected debug = true && AppConfig.debugEnabled;
  @ViewChild('focusRef', { static: false }) focusRef: ElementRef;

  constructor(
    public auth: AuthService,
    public translate: TranslateService,
    public theme: ThemeService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    if (this.debug) { console.log(this.constructor.name + ' -> translate.defaultLang => ', this.defaultLanguage); }

  }

  get defaultLanguage(): string {
    return this.translate.defaultLang;
  }

  ionViewWillEnter() {
    this.theme.checkStatusBar(this);
  }

}
