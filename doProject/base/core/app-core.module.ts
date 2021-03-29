import { NgModule, CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, Provider, ValueProvider } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';

import { AppConfig } from './app-config';
import { FilterPipe, GroupByPipe, GroupCollapsedPipe, OrderByPipe, ListSettingsComponent } from './abstract';
import { HasPermissionDirective } from './auth';
import { CheckboxComponent, DatetimeComponent, ToggleComponent, InputComponent, ButtonComponent } from './meta';
import { LocalizePipe } from './localization';
import { ChevronForwardDownIconComponent, ChevronUpDownIconComponent, ExpandButtonComponent, TextColorizedComponent } from './util';
import { TrustHtmlPipe, UnitsPipe } from './util';
import { deepAssign } from './util';
import { AutosizeContentDirective, HideDirective, IonSelectDirective, ShowDirective, UnitsDirective, ExpandedDirective } from './util';
import { DynamicFieldsGridDirective, DynamicFieldsGridComponent, DynamicFieldsRowDirective, DynamicFieldsRowComponent, DynamicFieldDirective } from './meta';


@NgModule({
  declarations: [
    ChevronForwardDownIconComponent,
    ChevronUpDownIconComponent,
    ExpandButtonComponent,
    TextColorizedComponent,

    LocalizePipe,

    FilterPipe,
    GroupByPipe,
    GroupCollapsedPipe,
    OrderByPipe,
    TrustHtmlPipe,
    UnitsPipe,
    ListSettingsComponent,

    AutosizeContentDirective,
    HasPermissionDirective,
    HideDirective,
    IonSelectDirective,
    ShowDirective,
    UnitsDirective,
    ExpandedDirective,

    DynamicFieldsGridDirective,
    DynamicFieldsGridComponent,
    DynamicFieldsRowDirective,
    DynamicFieldsRowComponent,
    DynamicFieldDirective,
    InputComponent,
    DatetimeComponent,
    ToggleComponent,
    CheckboxComponent,
    ButtonComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    RouterModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
    RouterModule,

    LocalizePipe,

    ChevronForwardDownIconComponent,
    ChevronUpDownIconComponent,
    ExpandButtonComponent,
    TextColorizedComponent,

    FilterPipe,
    GroupByPipe,
    GroupCollapsedPipe,
    OrderByPipe,
    TrustHtmlPipe,
    UnitsPipe,
    ListSettingsComponent,

    AutosizeContentDirective,
    HasPermissionDirective,
    HideDirective,
    IonSelectDirective,
    ShowDirective,
    UnitsDirective,
    ExpandedDirective,

    DynamicFieldsGridDirective,
    DynamicFieldsGridComponent,
    DynamicFieldsRowDirective,
    DynamicFieldsRowComponent,
    DynamicFieldDirective,
    InputComponent,
    DatetimeComponent,
    ToggleComponent,
    CheckboxComponent,
    ButtonComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
  providers: [
    OrderByPipe,
    StatusBar,
    AndroidFingerprintAuth,
  ],

})
export class AppCoreModule {

  public static forRoot(config: any): ModuleWithProviders<AppCoreModule> {
    console.log('AppCoreModule.forRoot()', { AppConfig, config });
    return {
      ngModule: AppCoreModule,
      providers: [
        {
          provide: 'AppConfig',
          useValue: deepAssign(AppConfig, config),
        }
      ]
    };
  }
}


