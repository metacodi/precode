import { Injectable, OnDestroy, Injector } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ModalController, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subscriber } from 'rxjs';
import { first } from 'rxjs/operators';
import { Ionic4DatepickerModalComponent } from '@logisticinfotech/ionic4-datepicker';
import * as moment from 'moment';

import { AppConfig } from 'src/core/app-config';
import { ApiService, ApiUserService, BlobService } from 'src/core/api';
import { AuthService, AuthenticationState } from 'src/core/auth';
import { deepAssign } from 'src/core/util';

import { AbstractBaseClass } from '../abstract/abstract-base.class';
import { Ionic4DatepickerOptions, LanguageType, CurrencyOptions } from './localization.types';


@Injectable({
  providedIn: 'root'
})
export class LocalizationService extends AbstractBaseClass {
  protected debug = true && AppConfig.debugEnabled;

  /** Configuración de la moneda por defecto.
   * ```typescript
   * currency: {
   *   code: 'EUR',
   *   display: 'symbol',
   *   digitsInfo: '1.0-2',
   * }
   * ```
   */
  currencySettings = AppConfig.currency;

  /** Almacena los carácteres decimal y separador de millares para los números. */
  protected numberSeparators: { decimal: string, group: string } = undefined;

  constructor(
    public injector: Injector,
    public api: ApiService,
    public auth: AuthService,
    public user: ApiUserService,
    public currencyPipe: CurrencyPipe,
    public blob: BlobService,
    public modal: ModalController,
    public popover: PopoverController,
  ) {
    super(injector);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    // Comprobamos si existe la propiedad.
    if (!AppConfig.language || !AppConfig.language.hasOwnProperty('i18n')) {
      throw Error(`No existe la propiedad 'i18n' en la configuración de la aplicación.`);
    }

    // Cargamos la configuración por defecto. Cuando el usuario se haya validado el configuración se obtendrá del blob `paymentsSettings`.
    this.currencySettings = AppConfig.currency;

    this.translate.onDefaultLangChange.subscribe((data: any) => {
      if (this.debug) { console.log('translate.onDefaultLangChange', data); }
    });
    this.translate.onLangChange.subscribe((data: any) => {
      if (this.debug) { console.log('translate.onLangChange', data); }
    });

    if (AppConfig.language.i18n) {
      // Obtenemos los idiomas disponibles del backend.
      this.api.post('search/lang', ['active', '=', 1]).pipe(first()).subscribe(data => { AppConfig.language.available = data; });

      // Monitorizamos la autenticación para detectar el login.
      this.auth.authenticationChanged.subscribe((state: AuthenticationState) => {
        if (this.debug) { console.log(this.constructor.name + '.constructor() -> authenticationChanged.subscribe(AuthenticationState)', state); }
        if (state.isAuthenticated) {

          // Obtenemos las traducciones completas del backend para el idioma indicado.
          this.setTranslation(state.user.idLang);

          // Obtenemos la moneda.
          this.blob.get('paymentsSettings').then(behavior => behavior.subscribe(settings => this.currencySettings = settings?.currency));
        }
      });
    }

    // Establecemos el idioma por defecto al iniciar.
    this.setDefaultLanguage();
  }


  // ---------------------------------------------------------------------------------------------------
  //  language
  // ---------------------------------------------------------------------------------------------------

  /** Establece el idioma por defecto en `TranslateService`. */
  setDefaultLanguage(): void {
    const isoCode = AppConfig.language.default.isoCode;
    if (this.debug) { console.log(this.constructor.name + '.setDefaultLanguage() => ', isoCode); }
    this.translate.setDefaultLang(isoCode);
  }

  /** Establece el idioma actual en `TranslateService`. */
  useLanguage(value: number | string): void {
    // Actualizamos el idioma de la aplicación.
    if (value) {
      // Obtenemos la definición del lenguaje.
      const language = this.getLanguage(value);
      if (this.debug) { console.log(this.constructor.name + '.useLanguage() => ', language.isoCode); }
      this.translate.use(language.isoCode);
    }
  }

  /** Obtiene las traducciones del idioma indicado desde el backend y las establece en `TranslateService`. */
  setTranslation(value: number | string): void {
    // Obtenemos la definición del lenguaje.
    const language = this.getLanguage(value);
    // Obtenemos las traducciones completas del backend para el idioma indicado.
    this.api.get(`localize.i18n?lang=${language.idreg}`).subscribe(data => {
      // Establecemos las traducciones en el servicio de traducción.
      this.translate.setTranslation(language.isoCode, data);
    });
  }

  /** Obtiene la definición del idioma indicado. */
  getLanguage(value: number | string): LanguageType {
    const available = AppConfig.language.available as LanguageType[];
    if (typeof value === 'number') {
      const language = available.find(l => +l.idreg === +value);
      if (language) { return language; }
    }
    if (typeof value === 'string') {
      const language = available.find(l => l.isoCode === value);
      if (language) { return language; }
    }
    throw new Error(`No se ha podido obtener la definición del idioma indicado: ${value}`);
  }

  // ---------------------------------------------------------------------------------------------------
  //  dateTimePicker
  // ---------------------------------------------------------------------------------------------------

  /** Muestra un Datepicker modal para la selección de una fecha y devuelve el resultado.
   * - Repo: <https://github.com/logisticinfotech/ionic4-datepicker>
   * - Web: <https://www.logisticinfotech.com/blog/ionic4-datepicker-component/>
   */
  async openDatePicker(ev: any, options?: Ionic4DatepickerOptions): Promise<any> {
    if (!options) { options = {}; }
    const selectedDate = options.selectedDate; delete options.selectedDate;
    const componentType = options.componentType || 'modal'; delete options.componentType;
    return new Promise<any>((resolve: any, reject: any) => {
      this.user.get().subscribe(async user => {
        const lang = this.getLanguage(user.idLang);
        // Obtenemos una configuración localizada para el usuario actual.
        const objConfig = deepAssign(this.defaultDatepickerOptions(lang), options);
        // const picker = await this.modal.create({
        const picker = await this[componentType].create({
          event: ev,
          component: Ionic4DatepickerModalComponent,
          // cssClass: 'li-ionic4-datePicker',
          componentProps: { objConfig, selectedDate },
        });
        picker.onDidDismiss().then((response) => {
          if (this.debug) { console.log(this.constructor.name + '.openDatePicker().onDismiss()', response.data.date); }
          resolve(response.data.date);
        }).catch(error => reject(error));
        await picker.present();
      });
    });
  }

  /** Obtiene la configuración por defecto localizada del componente Datepicker. */
  defaultDatepickerOptions(lang: LanguageType): Ionic4DatepickerOptions {
    return {
      momentLocale: lang.langCode,
      clearButton: false,
      monthsList: this.translate.instant('localization.datepicker.monthShortNames').split(','),
      weeksList: this.translate.instant('localization.datepicker.weeksList').split(','),
      dateFormat: this.translate.instant('localization.datepicker.dateFormat'),
      btnProperties: {
        expand: 'block',
      },
    };
  }


  // ---------------------------------------------------------------------------------------------------
  //  date & time
  // ---------------------------------------------------------------------------------------------------

  /**
   * Presenta una hora en formato `HH:mm` (24h) o `HH:mm AM|PM` (12h).
   *
   * Por defecto muestra la hora en formato 24h.
   *
   * ```typescript
   * moment(value).format('HH:mm');               // meridiem = false (default)
   * moment(value).locale(isoCode).format('LT');  // meridiem = true
   * ```
   */
  hour(value: any, meridiem?: boolean): string {
    if (!value) { return ''; }
    if (meridiem) {
      return this.localizedDateTime(value, 'LT');
    }
    return moment(value).format('HH:mm');
  }

  /**
   * Presenta una hora en formato `HH:mm:ss` (24h) o `HH:mm:ss AM|PM` (12h).
   *
   * Por defecto muestra la hora en formato 24h.
   *
   * ```typescript
   * moment(value).format('HH:mm:ss');              // meridiem = false (default)
   * moment(value).locale(isoCode).format('LTS');   // meridiem = true
   * ```
   */
  time(value: any, meridiem?: boolean): string {
    if (!value) { return ''; }
    if (meridiem) {
      return this.localizedDateTime(value, 'LTS');
    }
    return moment(value).format('HH:mm:ss');
  }

  /**
   * Presenta una fecha en formato localizado `DD/MM/YYYY`.
   * ```typescript
   * moment(value).locale(isoCode).format('L')
   * ```
   */
  shortDate(value: any): string {
    return this.localizedDateTime(value, 'L');
  }

  /**
   * Presenta una fecha en formato localizado. Ej: `4 Sep 2019`.
   * ```typescript
   * moment(value).locale(isoCode).format('ll')
   * ```
   */
  mediumDate(value: any): string {
    return this.localizedDateTime(value, 'll');
  }

  /**
   * Presenta una fecha en formato localizado. Ej: `September 4, 1986`.
   * ```typescript
   * moment(value).locale(isoCode).format('LL')
   * ```
   */
  longDate(value: any): string {
    return this.localizedDateTime(value, 'LL');
  }

  /**
   * Presenta una fecha y hora en formato localizado:
   *
   * `DD/MM/YYYY HH:mm` o `DD/MM/YYYY HH:mm AM|PM`
   */
  shortDateHour(value: any, meridiem?: boolean): string {
    return this.localizedDateTime(value, 'L')  + ' ' + this.hour(value, meridiem);
  }

  /**
   * Presenta una fecha y hora en formato localizado:
   *
   * `DD/MM/YYYY HH:mm:ss` o `DD/MM/YYYY HH:mm:ss AM|PM`
   */
  shortDateTime(value: any, meridiem?: boolean): string {
    return this.localizedDateTime(value, 'll')  + ' ' + this.time(value, meridiem);
  }

  /**
   * Presenta una fecha y hora en formato localizado:
   *
   * `4 Sep 2019 HH:mm` o `4 Sep 2019 HH:mm AM|PM`
   */
  mediumDateHour(value: any, meridiem?: boolean): string {
    return this.localizedDateTime(value, 'll')  + ' ' + this.hour(value, meridiem);
  }

  /**
   * Presenta una fecha y hora en formato localizado:
   *
   * `4 Sep 2019 HH:mm:ss` o `4 Sep 2019 HH:mm:ss AM|PM`
   */
  mediumDateTime(value: any, meridiem?: boolean): string {
    return this.localizedDateTime(value, 'L')  + ' ' + this.time(value, meridiem);
  }

  /**
   * Presenta una fecha y hora en formato localizado. Ej: `Thursday, September 4, 1986 8:30 PM`
   * ```typescript
   * moment(value).locale(isoCode).format('LLLL')
   * ```
   */
  longDateHour(value: any): string {
    return this.localizedDateTime(value, 'LLLL');
  }

  /**
   * Presenta una fecha y hora en formato localizado. Ej: `Thursday, September 4, 1986 8:30 PM`
   * ```typescript
   * moment(value).locale(isoCode).format('LLLL')
   * ```
   */
  longDateTime(value: any): string {
    return this.localizedDateTime(value, 'LLLL');
  }

  /**
   * Formatea la fecha y la hora en formato localizado.
   * ```typescript
   * moment(value).locale(isoCode).format('LLLL')
   * ```
   * @see {@link https://momentjs.com/docs/#/displaying/}
   */
  localizedDateTime(value: any, format?: string): string {
    if (!value) { return ''; }
    const language = this.getLanguage(this.user.instant?.idLang || AppConfig.language.default.idreg);
    return moment(value).locale(language.isoCode).format(format || 'LLLL');
  }


  // ---------------------------------------------------------------------------------------------------
  //  currency
  // ---------------------------------------------------------------------------------------------------

  /**
   * Presenta una cantidad en formato moneda utilizando el pip `CurrencyPipe` de `@angular/common`.
   *
   * ```html
   * <p>{{ row.total | localize:'currency':{digitsInfo: '1.0-2'} }}</p>
   * ```
   *
   * @param value The number to be formatted as currency.
   * ```typescript
   * CurrencyOptions: { currencyCode?: string, display?: string | boolean, digitsInfo?: string, locale?: string }
   * ```
   * @param currencyCode The {@link https://en.wikipedia.org/wiki/ISO_4217 ISO 4217} currency code,
   * such as `EUR` for the euro and `USD` for the US dollar. The default currency code can be
   * configured using the `DEFAULT_CURRENCY_CODE` injection token.
   * @param display The format for the currency indicator. One of the following:
   *   - `code`: Show the code (such as `EUR`).
   *   - `symbol`(default): Show the symbol (such as `€`).
   *   - `symbol-narrow`: Use the narrow symbol for locales that have two symbols for their currency.
   *     For example, the Canadian dollar CAD has the symbol `CA$` and the symbol-narrow `$`. If the
   *     locale has no narrow symbol, uses the standard symbol for the locale.
   *   - String: Use the given string value instead of a code or a symbol.
   *     For example, an empty string will suppress the currency & symbol.
   *   - Boolean (marked deprecated in v5): `true` for symbol and false for `code`.
   *
   * @param digitsInfo Decimal representation options, specified by a string
   * in the following format:<br>
   * <code>{minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}</code>.
   *   - `minIntegerDigits`: The minimum number of integer digits before the decimal point. Default is `1`.
   *   - `minFractionDigits`: The minimum number of digits after the decimal point. Default is `0`.
   *   - `maxFractionDigits`: The maximum number of digits after the decimal point. Default is `2`.
   * If not provided, the number will be formatted with the proper amount of digits,
   * depending on what the {@link https://en.wikipedia.org/wiki/ISO_4217 ISO 4217} specifies.
   * For example, the Canadian dollar has 2 digits, whereas the Chilean peso has none.
   * @param locale A locale code for the locale format rules to use.
   * When not supplied, uses the value of `LOCALE_ID`, which is `en-US` by default.
   * @see {@link guide/i18n#setting-up-the-locale-of-your-app Setting your app locale}.
   */
  currency(value: any, options?: CurrencyOptions): string {
    const currency = this.currencySettings;
    if (value === undefined || value === null || !currency) { return ''; }
    if (!options) { options = {}; }
    if (options.currencyCode === undefined) { options.currencyCode = currency.code; }
    if (options.display === undefined) { options.display = currency.display; }
    if (options.digitsInfo === undefined) { options.digitsInfo = currency.digitsInfo; }
    if (options.locale === undefined) { options.locale = this.getLanguage(this.user.instant?.idLang || AppConfig.language.default.idreg).isoCode; }
    return this.currencyPipe.transform(value, options.currencyCode, options.display, options.digitsInfo, options.locale);
  }

  /** Devuelve el separador decimal para los números. */
  get decimalSep(): string { return this.numberSeparators ? this.numberSeparators.decimal : this.discoverNumberSeparators().decimal; }
  /** Devuelve el separador millares para los números. */
  get groupSep(): string { return this.numberSeparators ? this.numberSeparators.group : this.discoverNumberSeparators().group; }
  /** Indica si el separador decimal corresponde al sistema anglosajón. */
  get isAngloSaxonNumericSystem(): boolean { return this.decimalSep === '.'; }
  /** Obtiene los carácteres decimal y separador de millares para los números. */
  protected discoverNumberSeparators() {
    const decimalSep = (0.5).toLocaleString().replace('0', '').replace('5', '');
    this.numberSeparators = { decimal: decimalSep, group: decimalSep === ',' ? '.' : ',' };
    return this.numberSeparators;
  }

  /** Controlamos la escritura de números por parte del usuario para localizar el separador decimal correctamente según el idioma. */
  numberInput(event: KeyboardEvent) {
    // NOTA: en este evento, obtenemos el caracter escrito cuando el valor ya está en el control nativo (view), pero no se ha enviado todavía al modelo.
    if (this.debug) { console.log(this.constructor.name + '.onIonInput()', event); }
    // Si estamos usando el sistema anglosajón...
    if (this.isAngloSaxonNumericSystem) { return; }
    // Obtenemos la tecla pulsada.
    const char = (event as any).detail.data;
    // Remplazamos el separador de millares por el decimal.
    if (char === ',') {
      // Referenciamos el elemento para obtener su valor.
      const el: any = event.target;
      // Si ya existía el separadaor decimal, lo remplazamos por un caracter en blanco.
      el.value = el.value.toString().split(',').join('.');
    }
  }

}
