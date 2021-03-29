import * as moment from 'moment';


export interface CurrencyOptions {
  currencyCode?: string;
  display?: string | boolean;
  digitsInfo?: string;
  locale?: string;
}

export interface LanguageType {
  idreg: number;
  active: boolean;
  isoCode: string;
  isoName: string;
  langCode: string;
  nativeName: string;
  phpDateFormat: string;
  phpDateTimeFormat: string;
}


export interface Ionic4DatepickerOptions {

  /** Tipo de componente base. */
  componentType?: 'modal' | 'popover';

  /** Fecha inicialmente seleccionada en el componente. */
  selectedDate?: string | moment.Moment | Date;

  /** (Optional) If default date is not provided and want to start Datepicker at specific Month/Year.
   * You can give the date in Date | string | moment object to this property.
   * @default new Date()
   */
  inputDate?: string | moment.Moment | Date;

  /** (Optional) If provided date object here, previous dates from this date will be disabled.
   * @default null
   */
  fromDate?: Date | null;

  /** (Optional) If provided date object here, future dates from this date will be disabled.
   * @default null
   */
  toDate?: Date | null;

  /** (Optional) Accepts number array 0(Sunday) to 6(Saturday).
   * Ex: `[0, 3, 6]` this will disable Sunday, Wednesday, Saturday in the whole calendar.
   */
  disableWeekdays?: number[];

  /** (Optional) Pass dates array if you like to make them disable from the selection.
   */
  disabledDates?: number[];

  /** (Optional) Using this property we can highlight the dates in datePicker.
   * So, we can easily find selected dates in datePicker. In this, we can pass the date and color
   * which you can use for highlight date. For example:
   * ```typescript
   * highlightedDates: [
   *   { date: new Date('2019-09-10'), color: '#ee88bf', fontColor: '#fff' },
   *   { date: new Date('2019-09-12'), color: '#50f2b1', fontColor: '#fff' }
   * ]
   * ```
   */
  highlightedDates?: number[];

  /** (Optional) Using this property we can hightes all sunday of month, and you can set any color for highlight sunday.
   * ```typescript
   * isSundayHighlighted : { fontColor: 'red' }
   * ```
   */
  isSundayHighlighted?: { fontColor?: string; };

  /** (Optional) This is the format used in the template
   * @default 'DD MMM YYYY'
   */
  dateFormat?: string;

  /** (Optional) So if you would like to use `06 Fev 2019` and formate is `DD MMM YYYY`
   * then you need to set `momentLocal: 'pt-BR'` in order to make it work.
   * @default 'en-US'
   */
  momentLocale?: string;

  /** (Optional) To change the language or change month texts. You can create an array like below:
   * ```typescript
   * const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
   * ```
   * @default ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
   */
  monthsList?: string[];

  /** (Optional) To show Monday as the first day Set to true.
   * The default value is `false`, which means `Sunday` is the first day by default.
   * @default false
   */
  mondayFirst?: boolean;

  /** (Optional) To change the language or change week text. You can create an array like below:
   * ```typescript
   * const weeksList = ['Sun', 'Mon', 'Tue', 'Wed', 'thu', 'Fri', 'Sat'];
   * ```
   * @default ['S', 'M', 'T', 'W', 'T', 'F', 'S']
   */
  weeksList?: string[];

  /** (Optional) if set to true years drop down will show years in ascending order.
   * @default false
   */
  yearInAscending?: boolean;

  /** (Optional) Boolean: boolean parameter relates to Today button hide/show.
   * @default true
   */
  showTodayButton?: boolean;

  /** (Optional) Boolean to specify whether to show the `x` button in ion-input or not, which will be used to clear value
   * @default true
   */
  clearButton?: boolean;

  /** (Optional) This object set the button defaults properties like expand, fill, size, disabled, strong, and color.
   * @default {
   *   expand = 'block',
   *   fill = 'solid',
   *   size = 'default',
   *   disabled = false,
   *   strong = false,
   *   color: 'primary'
   * }
   */
  btnProperties?: {
    expand?: 'block' | 'full';
    fill?: 'clear' | 'default' | 'outline' | 'solid';
    size?: 'default' | 'large' | 'small';
    disabled?: boolean;
    strong?: boolean;
    color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
  };

  /** (Optional) if set to true then buttons sequence will be Set/Close instead of Close/Set.
   * @default false
   */
  btnCloseSetInReverse?: boolean;

  /** (Optional) If it’s `false` Set button will be visible, and the user has to click on `Set`
   * to close model and get selected date value.
   * If it’s `true`, the `Set` button will be hidden and On Selection of Date, Model will be
   * automatically close and Date value will be passed to our component.
   * @default false
   */
  closeOnSelect?: boolean;

  /** (Optional) This property is to set src for the icon of next and previous button.
   * This option reacts on only `SVG` files. In this option, we should write the path of SVG files.
   * @default { prevArrowSrc: 'arrow-back', nextArrowSrc: 'arrow-forward' }
   */
  arrowNextPrev?: { prevArrowSrc?: string; nextArrowSrc?: string; };

  /** (Optional) By default, no title will be shown. If passed it will set model title.
   * @default ''
   */
  titleLabel?: string;

  /** (Optional) The label for the `Set` button.
   * @default 'Set'
   */
  setLabel?: string;

  /** (Optional) The label for the `Today` button.
   * @default 'Today'
   */
  todayLabel?: string;

  /** (Optional) The label for the `Close` button.
   * @default 'Close'
   */
  closeLabel?: string;

}
