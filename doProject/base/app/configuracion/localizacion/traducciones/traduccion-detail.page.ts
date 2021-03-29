import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';

import { TraduccionDetailSchema } from './traduccion-detail.schema';
import { TraduccionesListSchema } from './traducciones-list.schema';
import { LocalizacionService } from '../localizacion.service';
import * as path from 'path';


@Component({
  selector: 'app-traduccion-detail',
  templateUrl: 'traduccion-detail.page.html',
  styleUrls: ['traduccion-detail.page.scss'],
})
export class TraduccionDetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;
  @ViewChild('focusRefPath', { static: false }) focusRefPath: any;

  originalNavigateBackOnSave: boolean;

  constructor(
    public injector: Injector,
    public user: UserService,
    public theme: ThemeService,
    public service: LocalizacionService,
  ) {
    super(injector, TraduccionDetailSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    this.frm = new FormGroup({
      idreg: new FormControl(),
      path: new FormControl(),
      key: new FormControl('', [Validators.required]),
      localize_lang: new FormArray(AppConfig.language.available.map(lang => new FormGroup({
        idreg: new FormControl('new'),
        idLang: new FormControl(lang.idreg, [Validators.required]),
        idLocalize: new FormControl('new', [Validators.required]),
        description: new FormControl('', []),
      }))),
    });

  }

  ngOnInit() {
    super.ngOnInit();
    setTimeout(() => { this.focusRefPath.setFocus(); }, 150);
    this.originalNavigateBackOnSave = this.model.detail.navigateBackOnSave;
  }


  flag(idLang: any): string {
    if (!idLang) { return ''; }
    const lang = AppConfig.language.available.find(l => l.idreg === idLang);
    return `assets/flags/${lang.isoCode}.svg`;
  }

  async getRow(): Promise<any> {
    return super.getRow().then(row => {
      // Establecemos validadores 'required' para las traducciones que no son nuevas.
      this.localize_lang.controls.map((g: FormGroup) => {
        if (g.controls.idreg.value === 'new') {
          g.controls.description.clearValidators();
        } else {
          g.controls.description.setValidators([Validators.required]);
        }
      });
    });
  }

  async saveRow(navigateBackOnSave?: boolean): Promise<any> {
    if (navigateBackOnSave === undefined) { this.model.detail.navigateBackOnSave = this.originalNavigateBackOnSave; }
    const data = this.frm.value;
    const modified: any[] = data.localize_lang.filter(ll => ll.idreg !== 'new');
    return super.saveRow().then(saved => {
      const created: any[] = saved.localize_lang.filter(ll => !modified.find(o => o.idreg === ll.idreg));
      console.log('super.saveRow() => ', { created, modified });
      const query = this.service.registerQuery(TraduccionesListSchema);
      if (created.length && query.page && !query.completed) {
        query.clear(); this.service.request(query);
      } else {
        created.map(row => this.service.created.next({ entity: 'localize_lang', row }));
        modified.map(row => this.service.modified.next({ entity: 'localize_lang', row }));
      }
    });
  }

  saveCopy(row: any) {
    this.model.detail.navigateBackOnSave = false;
    this.frm.patchValue({ idreg: 'new' });
    (this.frm.controls.localize_lang as FormArray).controls.map((frm: FormControl) => frm.patchValue({ idreg: 'new' }));
    this.frm.updateValueAndValidity();
    this.saveRow(false).then(saved => {
    });
  }

  get localize_lang(): FormArray { return (this.frm.controls.localize_lang as FormArray); }

  // doNew() {
  //   this.frm.patchValue({ idreg: 'new' });
  //   (this.frm.controls.localize_lang as FormArray).controls.map((frm: FormControl) => frm.patchValue({ idreg: 'new' }));
  //   this.frm.updateValueAndValidity();
  // }

  copyToClipBoard(withTranslate: boolean = false) {
    const selBox = document.createElement('textarea');
    const cadena: string = this.row.path ? this.row.path + '.' + this.row.key : this.row.key;
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = withTranslate ? '{{\'' + cadena + '\' | translate }}' : cadena;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

  }

}
