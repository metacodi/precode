export const schemaContent = `import { FormGroup, FormControl, Validators } from '@angular/forms';

import { EntitySchema, deepAssign } from 'src/core';


export const {{EntityPlural}}Schema: EntitySchema = {
  name: {{entityName}},
  detail: {
    frm: new FormGroup({
      idreg: new FormControl(),
      descripcion: new FormControl('', [Validators.required]),
    }),
  },
  list: {
    fields: 'idreg',
    orderBy: 'descripcion',
    filter: ['descripcion'],
  }
};
`;

export const serviceContent = `import { Injectable, Injector } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core';
import { ApiService, ApiUserService } from 'src/core/api';


@Injectable({
  providedIn: 'root'
})
export class {{entityPlural}}Service extends AbstractModelService {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public user: ApiUserService,
  ) {
    super(injector, api);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
`;

export const moduleContent = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppCoreModule, AuthGuard } from 'src/core';

import { {{EntityPlural}}ListPage } from './{{entityPlural}}-list.page';
import { {{EntityPlural}}ListComponent } from './{{entityPlural}}-list.component';
import { {{EntitySingular}}DetailPage } from './{{entitySingular}}-detail.page';

const routes: Routes = [
  { path: '{{entityPlural}}', component: {{EntityPlural}}ListPage, canActivate: [AuthGuard], canLoad: [AuthGuard], children: [
    { path: 'list', component: {{EntityPlural}}ListComponent },
    { path: '', redirectTo: 'list', pathMatch: 'full' }
  ]},
  { path: '{{entitySingular}}/:id', component: {{EntitySingular}}DetailPage, canActivate: [AuthGuard], canLoad: [AuthGuard] },
];

@NgModule({
  imports: [
    AppCoreModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    {{EntityPlural}}ListPage,
    {{EntityPlural}}ListComponent,
    {{EntitySingular}}DetailPage,
  ],
  exports: [
    RouterModule,
  ],
})
export class {{EntityPlural}}Module { }
`;

export const listPageTsContent = `import { Component } from '@angular/core';

import { AppConfig } from 'src/config';

@Component ({
  selector: 'app-{{entityPlural}}-list-page',
  templateUrl: '{{entityPlural}}-list.page.html',
  styleUrls: ['{{entityPlural}}-list.page.scss'],
})
export class {{EntityPlural}}ListPage {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
`;

export const listPageHtmlContent = `<ion-header>

<ion-toolbar>
  <ion-buttons slot="start">
    <ion-back-button [text]="'buttons.back' | translate"></ion-back-button>
  </ion-buttons>
  <ion-title>{{'{{entityPlural}}.{{entityPlural}}' | translate}}</ion-title>
</ion-toolbar>

</ion-header>
<ion-content [scrollY]="false">

<ion-tabs>
  <ion-tab-bar #tabBarRef slot="top" style="display: none;">
    <ion-tab-button tab="list"></ion-tab-button>
  </ion-tab-bar>
</ion-tabs>

</ion-content>
`;

export const listComponentTs = `import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractListComponent } from 'src/core';
import { ApiUserService } from 'src/core/api';

import { {{EntityPlural}}Schema } from './{{entityPlural}}.schema';
import { {{EntityPlural}}Service } from './{{entityPlural}}.service';

@Component ({
  selector: 'app-{{entityPlural}}-list',
  templateUrl: '{{entityPlural}}-list.component.html',
  styleUrls: ['{{entityPlural}}-list.component.scss'],
})
export class {{EntityPlural}}ListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: {{EntityPlural}}Service,
    public user: ApiUserService,
  ) {
    super(injector, {{EntityPlural}}Schema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

}
`;

export const listComponentScss = `
// @import 'src/core/abstract/components/abstract-list.component.scss';
// @include multiselect;
`;
export const listComponentHtml = `<ion-header>

<ion-toolbar *ngIf="isModal">
  <ion-buttons slot="start">
    <ion-button (click)="modal.dismiss()">
      <ion-icon slot="icon-only" name="close-circle"></ion-icon>
    </ion-button>
  </ion-buttons>
  <ion-title>{{headerText}}</ion-title>
</ion-toolbar>

<ion-grid fixed *ngIf="!isPopover">
  <ion-row>
    <ion-col>
      <ion-searchbar #searchInput [(ngModel)]="search" debounce="500" placeholder="{{'buttons.search' | translate}}..."></ion-searchbar>
    </ion-col>
  </ion-row>
</ion-grid>

<ion-progress-bar *ngIf="loading" type="indeterminate"></ion-progress-bar>

</ion-header>
<ion-content>

<ion-list>
  <ion-grid fixed>
    <ion-row>
      <ion-col size="12" size-sm="12" size-md="6" size-xl="4" *ngFor="let row of rows | filter:search:list.filter | orderBy:list.orderBy">

        <ion-item-sliding>
          <ion-item (click)="select(row)" [detail]="!isPickRowMode" [ngClass]="{ selected: isSelected(row)}" class="item-color">

            <ion-icon *ngIf="preloading !== row.idreg" name="flag" slot="start"></ion-icon>
            <ion-spinner *ngIf="preloading === row.idreg" name="lines-small" slot="start"></ion-spinner>
            <ion-label class="ion-text-wrap">
              <ion-text [innerHTML]="colorMatch(row.nombre, search)"></ion-text>
              <p *ngIf="row.descripcion" [innerHTML]="colorMatch(row.descripcion, search)"></p>
            </ion-label>
            <!-- <ion-icon *ngIf="row.active" [name]="row.active ? 'checkmark' : 'close'" slot="end" size="small"></ion-icon> -->
            <ion-icon *ngIf="isSelected(row)" slot="end" name="checkmark"></ion-icon>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option (click)="deleteRow(row)" color="danger">
              <ion-icon slot="icon-only" name="trash"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>

      </ion-col>
    </ion-row>
  </ion-grid>
</ion-list>

<ion-infinite-scroll (ionInfinite)="refresh($event)" threshold="100px">
  <ion-infinite-scroll-content loadingSpinner="circles" loadingText="{{loadingText}}"></ion-infinite-scroll-content>
</ion-infinite-scroll>

</ion-content>
<ion-footer *ngIf="canCreate">

<ion-grid fixed>
  <ion-row>
    <ion-col>

      <ion-button (click)="select('new')" color="primary" expand="block">
        <ion-icon slot="start" name="add"></ion-icon>
        {{addNewText}}
      </ion-button>

    </ion-col>
  </ion-row>
</ion-grid>

</ion-footer>
`;

export const detailPageTs = `import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core';
import { ApiUserService } from 'src/core/api';

import { {{EntityPlural}}Schema } from './{{entityPlural}}.schema';
import { {{EntityPlural}}Service } from './{{entityPlural}}.service';

@Component ({
  selector: 'app-{{entitySingular}}-detail',
  templateUrl: '{{entitySingular}}-detail.page.html',
  styleUrls: ['{{entitySingular}}-detail.page.scss'],
})
export class {{EntitySingular}}DetailPage extends AbstractDetailComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: {{EntityPlural}}Service,
    public user: ApiUserService,
  ) {
    super(injector, {{EntityPlural}}Schema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

}
`;

export const detailPageHtml = `<ion-header>

<ion-toolbar>
  <ion-buttons slot="start">
    <ion-back-button [text]="'buttons.back' | translate"></ion-back-button>
  </ion-buttons>
  <ion-title>{{headerText}}</ion-title>
</ion-toolbar>

</ion-header>
<ion-content>

  <form [formGroup]="frm" (ngSubmit)="saveRow()">

    <ion-card class="detail">

      <ion-grid>
        <ion-row>
          <ion-col>

            <ion-item>
              <ion-label position="floating">{{'{{entityPlural}}.nombre' | translate}} <ion-text color="danger">*</ion-text></ion-label>
              <ion-input #focusRef formControlName="nombre" type="text" placeholder="{{'{{entityPlural}}.nombre' | translate}} *" required></ion-input>
            </ion-item>

          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col>

            <ion-item>
              <ion-icon slot="start" name="location"></ion-icon>
              <ion-input formControlName="descripcion" type="text" placeholder="{{'{{entityPlural}}.descripcion' | translate}}" spellcheck="false" required></ion-input>
            </ion-item>

          </ion-col>
        </ion-row>
      </ion-grid>


      <div class="error ion-text-start">
        <p *ngIf="initialized && (!isNew || isNew && (getter('nombre').touched || getter('nombre').dirty)) && getter('nombre').errors?.required">{{'{{entityPlural}}.nombre_required' | translate}}</p>
        <p *ngIf="initialized && (!isNew || isNew && (getter('descripcion').touched || getter('descripcion').dirty)) && getter('descripcion').errors?.required">{{'{{entityPlural}}.descripcion_required' | translate}}</p>
      </div>

      <ion-grid class="buttons">
        <ion-row>
          <ion-col>

            <ion-button type="button" (click)="deleteRow()" color="secondary" expand="block">{{(isNew ? 'buttons.cancel' : 'buttons.delete') | translate | uppercase }}</ion-button>

          </ion-col>
          <ion-col>

            <ion-button type="submit" [disabled]="!initialized || frm.invalid || frm.pristine" color="primary" expand="block">{{'buttons.save' | translate | uppercase }}</ion-button>

          </ion-col>
        </ion-row>
      </ion-grid>

    </ion-card>
  </form>

</ion-content>
`;
