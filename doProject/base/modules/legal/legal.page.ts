import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from 'src/config';
import { ApiService, ApiRequestOptions } from 'src/core/api';
import { ThemeService, ConsoleService } from 'src/core/util';

import { LegalService } from './legal.service';


@Component({
  selector: 'app-legal',
  templateUrl: 'legal.page.html',
  styleUrls: ['legal.page.scss'],
})
export class LegalPage implements OnInit {
  private debug = true && AppConfig.debugEnabled;

  contentHTml: any;

  constructor(

    private translate: TranslateService,
    public theme: ThemeService,
    public console: ConsoleService,
    public service: LegalService,
    private api: ApiService,
    private sanitizer: DomSanitizer,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  ngOnInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnInit()'); }
    const options: ApiRequestOptions = { responseType: 'text' };
    this.service.getLegal().subscribe(content => { this.contentHTml = this.sanitizer.bypassSecurityTrustHtml(content); });
  }


}
