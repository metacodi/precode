// import { ValidatorFn } from '@angular/forms';


// ---------------------------------------------------------------------------------------------------
//  types
// ---------------------------------------------------------------------------------------------------

export type ValueType = 'boolean' | 'integer' | 'float' | 'string' | 'datetime' | 'date' | 'time';
export type DataType = 'varchar' | 'text' | 'json' | 'int' | 'tinyint' | 'smallint' | 'double' | 'float' | 'decimal' | 'datetime' | 'date' | 'time';
export type GridColSizeType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto';

export type CharsetType = 'utf8';

export type ColorType = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';

export type SlotType = 'start' | 'end' | 'icon-only';

export type ModeType = 'ios' | 'md';

export type FormBehaviorType = 'touched' | 'dirty' | 'isNew';

export type stringOrExpr = string | { expr: string };
export type booleanOrExpr = boolean | { expr: string };
export type numberOrExpr = number | { expr: string };


// ---------------------------------------------------------------------------------------------------
//  Field controls
// ---------------------------------------------------------------------------------------------------

/** Definición base para todos los tipos de componente. */
export interface BaseControlType {

  /** Establece el atributo `class` del componente o control.
   *
   * - Las clases se pueden aplicar a nivel de componente (`ion-item`):
   *
   * ```typescript
   * component: { class: 'sport-car pretty' },
   * ```
   * <br>
   *
   * ```html
   * <ion-item class="sport-car pretty">
   *   <ion-label></ion-label>
   * </ion-item>
   * ```
   * - ... o a nivel de control (`ion-input`, `ion-toggle`, `ion-button`, `ion-datetime`, `ion-checkbox`, `ion-icon`, `ion-label`):
   *
   * ```typescript
   * component: {
   *   label: { class: 'sport-car pretty' }
   * }
   * ```
   * <br>
   *
   * ```html
   * <ion-item>
   *   <ion-label class="sport-car pretty"></ion-label>
   * </ion-item>
   * ```
   */
  class?: string | undefined;

  /** Adds and removes CSS classes on an HTML element.
   *
   * - Las clases se pueden aplicar a nivel de componente (`ion-item`):
   *
   * ```typescript
   * component: { ngClass: `{'error': invalid }` },
   * ```
   * <br>
   *
   * ```html
   * <ion-item [ngClass]="{'error': invalid }">
   *   <ion-input></ion-input>
   * </ion-item>
   * ```
   * - ... o a nivel de control (`ion-input`, `ion-toggle`, `ion-button`, `ion-datetime`, `ion-checkbox`, `ion-icon`, `ion-label`):
   *
   * ```typescript
   * component: {
   *   input: { ngClass: `{'error': invalid }` }
   * }
   * ```
   * <br>
   *
   * ```html
   * <ion-item>
   *   <ion-input [ngClass]="{'error': invalid }"></ion-input>
   * </ion-item>
   * ```
   */
  ngClass?: string | undefined;

  /** Establece el atributo `style` del componente o control.
   *
   * - Los estilos se pueden aplicar a nivel de componente (`ion-item`):
   *
   * ```typescript
   * component: { style: 'margin-top: 10px; font-size: 14px;' },
   * ```
   * <br>
   *
   * ```html
   * <ion-item style="margin-top: 10px; font-size: 14px;">
   *   <ion-label></ion-label>
   * </ion-item>
   * ```
   * - ... o a nivel de control (`ion-input`, `ion-toggle`, `ion-button`, `ion-datetime`, `ion-checkbox`, `ion-icon`, `ion-label`):
   *
   * ```typescript
   * component: {
   *   label: { style: 'margin-top: 10px; font-size: 14px;' }
   * }
   * ```
   * <br>
   *
   * ```html
   * <ion-item>
   *   <ion-label style="margin-top: 10px; font-size: 14px;"></ion-label>
   * </ion-item>
   * ```
   */
  style?: string | undefined;

  /** Adds and removes CSS styles on an HTML element.
   *
   * - Los estilos se pueden aplicar a nivel de componente (`ion-item`):
   *
   * ```typescript
   * component: { ngStyle: `{'error': invalid }` },
   * ```
   * <br>
   *
   * ```html
   * <ion-item [ngStyle]="{'error': invalid }">
   *   <ion-input></ion-input>
   * </ion-item>
   * ```
   * - ... o a nivel de control (`ion-input`, `ion-toggle`, `ion-button`, `ion-datetime`, `ion-checkbox`, `ion-icon`, `ion-label`):
   *
   * ```typescript
   * component: {
   *   input: { ngStyle: `{'error': invalid }` }
   * }
   * ```
   * <br>
   *
   * ```html
   * <ion-item>
   *   <ion-input [ngStyle]="{'error': invalid }"></ion-input>
   * </ion-item>
   * ```
   */
  ngStyle?: string | undefined;
}

/** Definición base para todos los controles que pueden recibir el foco. */
export interface FocusableControlType {

  /**
   * Emitted when the control loses focus.
   *
   * Para obtener una referencia del evento el argumento debe tener el nombre `$event`.
   * ```typescript
   * input: { ionBlur: `inputOnBlur($event)` }
   * ```
   * <br>
   *
   * ```html
   * <ion-input (ionBlur)="inputOnBlur($event)">
   * ```
   * @category Event
   */
  ionBlur?: string | undefined;

  /**
   * Emitted when the control has focus.
   *
   * Para obtener una referencia del evento el argumento debe tener el nombre `$event`.
   * ```typescript
   * input: { ionFocus: `inputFocused($event)` }
   * ```
   * <br>
   *
   * ```html
   * <ion-input (ionFocus)="inputFocused($event)">
   * ```
   * @category Event
   */
  ionFocus?: string | undefined;
}

/** Definición base para todos los controles editables. */
export interface EditableControlType {

  /**
   * Emitted when the value has changed.
   *
   * Para obtener una referencia del evento el argumento debe tener el nombre `$event`.
   * ```typescript
   * input: { ionChange: `inputChanged($event)` }
   * ```
   * <br>
   *
   * ```html
   * <ion-input (ionChange)="inputChanged($event)">
   * ```
   * @category Event
   */
  ionChange?: string | undefined;
}

export interface IconControlType extends BaseControlType {

  /** The color to use for the background of the item. */
  color?: ColorType | { expr: string } | undefined;

  /** Specifies which icon to use on ios mode. */
  ios?: stringOrExpr;

  /** Specifies which icon to use on md mode. */
  md?: stringOrExpr;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** Specifies which icon to use from the built-in set of icons. */
  name?: stringOrExpr;

  /** The size of the icon. Available options are: "small" and "large". */
  size?: 'small' | 'large';

  /** Specifies the exact src of an SVG file to use. */
  src?: stringOrExpr;

  /** Content is placed between the named slots if provided without a slot. */
  slot?: SlotType;
}

export interface LabelControlType extends BaseControlType {

  /** The color to use for the text of the label. */
  color?: ColorType | { expr: string } | undefined;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** The position determines where and how the label behaves inside an item. */
  position?: 'floating' | 'fixed' | 'stacked' | undefined;

  /** The text to show in the label.
   *
   * Si queremos que el texto sea evaluado como una expresión podemos utilizar la siguiente notación:
   *
   * ```typescript
   * label: { text: { expr: `isNew ? 'buttons.cancel' : 'buttons.delete'` }},
   * ```
   */
  text?: stringOrExpr;

  /** Pipes que se aplicarán al texto.
   *
   * - Si no se establece ningún valor, por defecto se aplica el pipe de traducción.
   *
   * ```typescript
   * label: 'buttons.accept',
   * ```
   * <br>
   *
   * ```html
   * <ion-label>{{'buttons.accept' | translate }}</ion-label>
   * ```
   *
   * - Los pipes se aplican en el mismo orden que aparecen declarados.
   *
   * ```typescript
   * label: { text: 'buttons.accept', pipes: ['translate', 'uppercase'] },
   * ```
   * <br>
   *
   * ```html
   * <ion-label>{{'buttons.accept' | translate | uppercase }}</ion-label>
   * ```
   *
   * - Para establecer un texto evitando el pipe de traducción por defecto:
   *
   * ```typescript
   * label: { text: 'Aceptar', pipes: [] },
   * ```
   * <br>
   *
   * ```html
   * <ion-label>Aceptar</ion-label>
   * ```
   */
  pipes?: ('translate' | 'uppercase' | 'lowercase' | 'titlecase')[];
}

export interface ButtonControlType extends BaseControlType, FocusableControlType {

  /** The type of button. */
  buttonType?: 'button' | 'submit' | 'reset';

  /** The color to use from your application's color palette. Default options are: "primary", "secondary", "tertiary", "success", "warning", "danger", "light", "medium", and "dark". For more information on colors, see theming. */
  color?: ColorType | { expr: string } | undefined;

  /** This attribute instructs browsers to download a URL instead of navigating to it, so the user will be prompted to save it as a local file. If the attribute has a value, it is used as the pre-filled file name in the Save prompt (the user can still change the file name if they want). */
  download?: string | undefined;

  /** Set to "block" for a full-width button or to "full" for a full-width button without left and right borders. */
  expand?: 'block' | 'full' | undefined;

  /** Set to "clear" for a transparent button, to "outline" for a transparent button with a border, or to "solid". The default style is "solid" except inside of a toolbar, where the default is "clear". */
  fill?: 'clear' | 'default' | 'outline' | 'solid' | undefined;

  /** Contains a URL or a URL fragment that the hyperlink points to. If this property is set, an anchor tag will be rendered. */
  href?: string | undefined;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** Specifies the relationship of the target object to the link object. The value is a space-separated list of link types. */
  rel?: string | undefined;

  /** When using a router, it specifies the transition direction when navigating to another page using href. */
  routerDirection?: 'back' | 'forward' | 'root';

  /** The button shape. */
  shape?: 'round' | undefined;

  /** The button size. */
  size?: 'default' | 'large' | 'small' | undefined;

  /** If true, activates a button with a heavier font weight. */
  strong?: boolean;

  /** Specifies where to display the linked URL. Only applies when an href is provided. Special keywords: "_blank", "_self", "_parent", "_top". */
  target?: '_blank' | '_self' | '_parent' | '_top' | undefined;

  /** The type of the button. */
  type?: 'button' | 'submit' | 'reset';
}

export interface DatetimeControlType extends BaseControlType, FocusableControlType, EditableControlType {

  /** The text to display on the picker's cancel button. */
  cancelText?: stringOrExpr;

  /** Full day of the week names. This can be used to provide locale names for each day in the week. Defaults to English. */
  dayNames?: stringOrExpr | undefined;

  /** Short abbreviated day of the week names. This can be used to provide locale names for each day in the week. Defaults to English. */
  dayShortNames?: stringOrExpr | undefined;

  /** Values used to create the list of selectable days. By default every day is shown for the given month. However, to control exactly which days of the month to display, the `dayValues` input can take a number, an array of numbers, or a string of comma separated numbers. Note that even if the array days have an invalid number for the selected month, like `31` in February, it will correctly not show days which are not valid for the selected month. */
  dayValues?: number | number[] | string[] | undefined;

  /** The display format of the date and time as text that shows within the item. When the `pickerFormat` input is not used, then the `displayFormat` is used for both display the formatted text, and determining the datetime picker's columns. See the `pickerFormat` input description for more info. Defaults to `MMM D, YYYY.` */
  displayFormat?: stringOrExpr;

  /** The timezone to use for display purposes only. See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString Date.prototype.toLocaleString}() for a list of supported timezones. If no value is provided, the component will default to displaying times in the user's local timezone. */
  displayTimezone?: stringOrExpr | undefined;

  /** The text to display on the picker's "Done" button. */
  doneText?: stringOrExpr;

  /** Values used to create the list of selectable hours. By default the hour values range from `0` to `23` for 24-hour, or `1` to `12` for 12-hour. However, to control exactly which hours to display, the `hourValues` input can take a number, an array of numbers, or a string of comma separated numbers. */
  hourValues?: number | number[] | string[] | undefined;

  /** The maximum datetime allowed. Value must be a date string following the {@link https://www.w3.org/TR/NOTE-datetime ISO 8601 datetime format standard}, `1996-12-19`. The format does not have to be specific to an exact datetime. For example, the maximum could just be the year, such as `1994`. Defaults to the end of this year. */
  max?: stringOrExpr | undefined;

  /** The minimum datetime allowed. Value must be a date string following the {@link https://www.w3.org/TR/NOTE-datetime ISO 8601 datetime format standard}, such as `1996-12-19`. The format does not have to be specific to an exact datetime. For example, the minimum could just be the year, such as `1994`. Defaults to the beginning of the year, 100 years ago from today. */
  min?: stringOrExpr | undefined;

  /** Values used to create the list of selectable minutes. By default the minutes range from `0` to `59`. However, to control exactly which minutes to display, the `minuteValues` input can take a number, an array of numbers, or a string of comma separated numbers. For example, if the minute selections should only be every 15 minutes, then this input value would be `minuteValues="0,15,30,45"`. */
  minuteValues?: number | number[] | string[] | undefined;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** Full names for each month name. This can be used to provide locale month names. Defaults to English. */
  monthNames?: stringOrExpr | undefined;

  /** Short abbreviated names for each month name. This can be used to provide locale month names. Defaults to English. */
  monthShortNames?: stringOrExpr | undefined;

  /** Values used to create the list of selectable months. By default the month values range from `1` to `12`. However, to control exactly which months to display, the `monthValues` input can take a number, an array of numbers, or a string of comma separated numbers. For example, if only summer months should be shown, then this input value would be `monthValues="6,7,8"`. Note that month numbers do not have a zero-based index, meaning January's value is `1`, and December's is `12`. */
  monthValues?: number | number[] | string[] | undefined;

  /** The name of the control, which is submitted with the form data. */
  name?: string;

  /** The format of the date and time picker columns the user selects. A datetime input can have one or many datetime parts, each getting their own column which allow individual selection of that particular datetime part. For example, year and month columns are two individually selectable columns which help choose an exact date from the datetime picker. Each column follows the string parse format. Defaults to use `displayFormat`. */
  pickerFormat?: string | undefined;

  /** Any additional options that the picker interface can accept. See the {@link https://github.com/ionic-team/ionic/blob/master/core/src/components/picker Picker API docs} for the picker options. */
  pickerOptions?: undefined | { columns?: string[] | undefined; buttons?: string[] | undefined; cssClass?: string | string[] | undefined; showBackdrop?: boolean | undefined; backdropDismiss?: boolean | undefined; animated?: boolean | undefined; mode?: 'ios' | 'md' | undefined; keyboardClose?: boolean | undefined; id?: string | undefined };

  /** The text to display when there's no date selected yet. Using lowercase to match the input attribute. */
  placeholder?: stringOrExpr | undefined;

  /** If `true`, the datetime appears normal but is not interactive. */
  readonly?: booleanOrExpr;

  /** Values used to create the list of selectable years. By default the year values range between the `min` and `max` datetime inputs. However, to control exactly which years to display, the `yearValues` input can take a number, an array of numbers, or string of comma separated numbers. For example, to show upcoming and recent leap years, then this input's value would be `yearValues="2024,2020,2016,2012,2008`". */
  yearValues?: number | number[] | string | undefined;

  /**
   * Emitted when the datetime selection was cancelled.
   *
   * Para obtener una referencia del evento el argumento debe tener el nombre `$event`.
   * ```typescript
   * datetime: { ionCancel: `datetimeOnCancel($event)` }
   * ```
   * <br>
   *
   * ```html
   * <ion-datetime (ionCancel)="datetimeOnCancel($event)">
   * ```
   * @category Event
   */
  ionCancel?: string;
}

export interface CheckboxControlType extends BaseControlType, FocusableControlType, EditableControlType {

  /** If true, the checkbox is selected. */
  checked?: booleanOrExpr;

  /** The color to use from your application's color palette. Default options are: "primary", "secondary", "tertiary", "success", "warning", "danger", "light", "medium", and "dark". For more information on colors, see theming. */
  color?: ColorType | { expr: string } | undefined;

  /** If true, the checkbox will visually appear as indeterminate. */
  indeterminate?: booleanOrExpr;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** The name of the control, which is submitted with the form data. */
  name?: string;

  /** Content is placed between the named slots if provided without a slot. */
  slot?: SlotType;
}

export interface ToggleControlType extends BaseControlType, FocusableControlType, EditableControlType {

  /** If true, the toggle is selected. */
  checked?: booleanOrExpr;

  /** The color to use from your application's color palette. Default options are: "primary", "secondary", "tertiary", "success", "warning", "danger", "light", "medium", and "dark". For more information on colors, see theming. */
  color?: ColorType | { expr: string } | undefined;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** The name of the control, which is submitted with the form data. */
  name?: string;

  /** Content is placed between the named slots if provided without a slot. */
  slot?: SlotType;
}

export interface InputControlType extends BaseControlType, FocusableControlType, EditableControlType {

  /** If the value of the type attribute is "file", then this attribute will indicate the types of files that the server accepts, otherwise it will be ignored. The value must be a comma-separated list of unique content type specifiers. */
  accept?: string | undefined;

  /** Indicates whether and how the text value should be automatically capitalized as it is entered/edited by the user. */
  autocapitalize?: 'on' | 'off';

  /** Indicates whether the value of the control can be automatically completed by the browser. */
  autocomplete?: 'on' | 'off';

  /** Whether auto correction should be enabled when the user is entering/editing the text value. */
  autocorrect?: 'on' | 'off';

  /** This Boolean attribute lets you specify that a form control should have input focus when the page loads. */
  autofocus?: booleanOrExpr;

  /** If true, a clear icon will appear in the input when there is a value. Clicking it clears the input. */
  clearInput?: booleanOrExpr;

  /** If true, the value will be cleared after focus upon edit. Defaults to true when type is "password", false for all other types. */
  clearOnEdit?: booleanOrExpr | undefined;

  /** The color to use from your application's color palette. Default options are: "primary", "secondary", "tertiary", "success", "warning", "danger", "light", "medium", and "dark". For more information on colors, see theming. */
  color?: ColorType | { expr: string } | undefined;

  /** Set the amount of time, in milliseconds, to wait to trigger the ionChange event after each keystroke. */
  debounce?: number;

  /** A hint to the browser for which keyboard to display. Possible values: "none", "text", "tel", "url", "email", "numeric", "decimal", and "search". */
  inputmode?: 'decimal' | 'email' | 'none' | 'numeric' | 'search' | 'tel' | 'text' | 'url' | undefined;

  /** The maximum value, which must not be less than its minimum (min attribute) value. */
  max?: string | undefined;

  /** If the value of the type attribute is text, email, search, password, tel, or url, this attribute specifies the maximum number of characters that the user can enter. */
  maxlength?: number | undefined;

  /** The minimum value, which must not be greater than its maximum (max attribute) value. */
  min?: string | undefined;

  /** If the value of the type attribute is text, email, search, password, tel, or url, this attribute specifies the minimum number of characters that the user can enter. */
  minlength?: number | undefined;

  /** The mode determines which platform styles to use. */
  mode?: ModeType;

  /** If true, the user can enter more than one value. This attribute applies when the type attribute is set to "email" or "file", otherwise it is ignored. */
  multiple?: boolean | undefined;

  /** The name of the control, which is submitted with the form data. */
  name?: string;

  /** A regular expression that the value is checked against. The pattern must match the entire value, not just some subset. Use the title attribute to describe the pattern to help the user. This attribute applies when the value of the type attribute is "text", "search", "tel", "url", "email", or "password", otherwise it is ignored. */
  pattern?: string | undefined;

  /** Instructional text that shows before the input has a value. */
  placeholder?: stringOrExpr;

  /** If true, the user cannot modify the value. */
  readonly?: booleanOrExpr;

  /** If true, the user must fill in a value before submitting a form. */
  required?: booleanOrExpr;

  /** The initial size of the control. This value is in pixels unless the value of the type attribute is "text" or "password", in which case it is an integer number of characters. This attribute applies only when the type attribute is set to "text", "search", "tel", "url", "email", or "password", otherwise it is ignored. */
  size?: number | undefined;

  /** If true, the element will have its spelling and grammar checked. */
  spellcheck?: boolean;

  /** Works with the min and max attributes to limit the increments at which a value can be set. Possible values are: "any" or a positive floating point number. */
  step?: string | undefined;

  /** The type of control to display. The default type is text. */
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';

  /**
   * Emitted when a keyboard input occurred.
   *
   * Para obtener una referencia del evento el argumento debe tener el nombre `$event`.
   * ```typescript
   * input: { ionInput: `inputKeyPress($event)` }
   * ```
   * <br>
   *
   * ```html
   * <ion-input (ionInput)="inputKeyPress($event)">
   * ```
   * @category Event
   */
  ionInput?: string | undefined;
}

export type ControlType = IconControlType | LabelControlType | ButtonControlType | DatetimeControlType | CheckboxControlType | ToggleControlType | InputControlType;


// ---------------------------------------------------------------------------------------------------
//  Field component
// ---------------------------------------------------------------------------------------------------

/** Definición de los errores de validación para el campo de datos. @see `BaseComponentType.errors` */
export interface ValidatorType {
  validator: string;
  text: stringOrExpr;
  behavior?: FormBehaviorType[];
  class?: string;
}

/** Definición base para todos los contenedores de componente. */
export interface BaseComponentType extends BaseControlType {

  /**
   * Tamaño responsivo de la columna `ion-col` que encapsula el componente.
   * Se utiliza únicamente a través de las directivas de grupo en el componente `MetaCroupComponent`
   * y de colección de campos `DynamicFieldCollectionComponent`.
   *
   * - Se puede establecere un valor numérico:
   *
   * ```typescript
   * size: 12
   * ```
   * <br>
   *
   * ```html
   * <ion-col size="12">
   * ```
   *
   * - ... o bien un conjunto de valores para diferentes puntos de ruptura:
   *
   * ```typescript
   * size: { xs: 12, md: 6, lg: 'auto' }
   * ```
   * <br>
   *
   * ```html
   * <ion-col size-xs="12" size-md="6" size-lg="auto">
   * ```
   */
  size?: GridColSizeType | { xs?: GridColSizeType; sm?: GridColSizeType; md?: GridColSizeType; lg?: GridColSizeType; xl?: GridColSizeType } | undefined;

  /**
   * Clave que se utiliza para evaluar los permisos del usuario a través de la ditectiva `hasPermission`.
   * ```html
   * <ng-container [hasPermission]="field.permission">
   * ```
   */
  permission?: string | boolean;

  /**
   * Expresión que se evalúa para obtener el estado de disponibilidad del componente.
   *
   * ```typescript
   * disabled: '!initialized || frm.invalid || frm.pristine'
   * ```
   * <br>
   *
   * ```html
   * <ion-item [disabled]="!initialized || frm.invalid || frm.pristine">
   * ```
   */
  disabled?: boolean | string;

  /**
   * Expresión que se evalúa para obtener el estado de visibilidad del componente.
   *
   * ```typescript
   * visible: 'frm.invalid || frm.pristine'
   * ```
   * <br>
   *
   * ```html
   * <ion-button *ngIf="frm.invalid || frm.pristine">
   * ```
   */
  visible?: boolean | string;

  /**
   * Expresión que se evalúa para obtener los validadores del control en el formualrio.
   * ```typescript
   * validators: '[Validators.required, Validators.email]'
   * ```
   * <br>
   *
   * ```typescript
   * const validators = evalExpr(field.validators, { Validators }));
   * const control = new FormControl(defaultValue, validators)
   * ```
   */
  validators?: string; // string | ValidatorFn[]

  /**
   * Definición de los errores de validación para el campo de datos.
   *
   * ```typescript
   * errors: [
   *   { validator: 'required', text: 'login.email_required' },
   * ]
   * ```
   *
   * Si no se establece ningún comportamiento `behavior` se utilizan todos los disponibles definidos en `FormBehaviorType`.
   * Si no se establece una clase de estilos para el elemento se utiliza 'error' por defecto.
   * ```typescript
   * errors: [
   *   {
   *     validator: 'invalid',
   *     text: 'login.email_invalid',
   *     behavior: ['touched', 'dirty', 'isNew'],
   *     class: 'error'
   *   },
   * ]
   * ```
   */
  errors?: ValidatorType[];

  /**
   * Expresión que se utiliza para el evento `click` del componente.
   *
   * ```typescript
   * component: { click: `saveRow()` }
   * ```
   * <br>
   *
   * ```html
   * <ion-button (click)="saveRow()">
   * ```
   * @category Method
   */
  click?: string;
}

export interface ButtonComponentType extends BaseComponentType {
  type: 'button';
  icon?: string | IconControlType;
  label?: string | LabelControlType;
  button?: ButtonControlType;
}

export interface CheckboxComponentType extends BaseComponentType {
  type: 'checkbox';
  icon?: string | IconControlType;
  label?: string | LabelControlType;
  checkbox?: CheckboxControlType;
}

export interface DatetimeComponentType extends BaseComponentType {
  type: 'datetime';
  icon?: string | IconControlType;
  label?: string | LabelControlType;
  datetime?: DatetimeControlType;
}

export interface InputComponentType extends BaseComponentType {
  type: 'input';
  icon?: string | IconControlType;
  label?: string | LabelControlType;
  input?: InputControlType;
}

export interface ToggleComponentType extends BaseComponentType {
  type: 'toggle';
  icon?: string | IconControlType;
  label?: string | LabelControlType;
  toggle?: ToggleControlType;
}

export type FieldComponentType = ButtonComponentType | CheckboxComponentType | DatetimeComponentType | InputComponentType | ToggleComponentType;


// ---------------------------------------------------------------------------------------------------
//  Field
// ---------------------------------------------------------------------------------------------------

export interface FieldColumnType {
  type: DataType;
  length?: number;
  decimal?: number;
  /** El campo admite nulos. @default true */
  nullable?: boolean;
  autoIncrement?: boolean;
  /** Indica si es un campo de valores únicos, como las claves. @default false */
  unique?: boolean;
  /** Campo indexado. El nombre se obtiene de la fórmula: `IDX_entityName_fieldName` */
  index?: boolean;
  virtual?: boolean;
  comment?: string;
  charset?: CharsetType;
  collation?: string;
  binnary?: boolean;
  /** Indica si se encriptarán los valores. */
  hash?: boolean;
  /** Valor por defecto. Si no se indica se utiliza null. */
  default?: any;
}

export interface FieldType {
  /** Nombre del campo. Se utiliza con la propiedad `formControlName` para enlazar el control con formularios reactivos. */
  name?: string;

  /** Indica el tipo de valor del componente para el _front-end_.
   *
   * ```typescript
   * value: 'boolean'
   * ```
   * Si se quiere establecer un valor por defecto:
   * ```typescript
   * value: { type: 'boolean', default: true }
   * ```
   * <br>
   *
   * ```typescript
   * const defaultValue = field.value.default;
   * const control = new FormControl(defaultValue, validators)
   * ```
   */
  value: ValueType | { type: ValueType; default?: any } | undefined;

  // Back-end
  column?: FieldColumnType;

  // Front-end
  component?: FieldComponentType;
}

export interface FieldTemplateType extends FieldType {
  /** Nombre del campo cuando se usa la plantilla pero no se establece `name`. */
  template: string;
}


// ---------------------------------------------------------------------------------------------------
//  Entity
// ---------------------------------------------------------------------------------------------------

export type EntityAssociationType =
  'composite' /* DELETE CASCADE */ |
  'aggregate' /* DELETE SET NULL */
;

export interface EntityRelationType {
  /** Nombre de la relación. */
  name?: string;
  parent: string;
  foreignTarget?: string;
  foreignKey: string;
  association: EntityAssociationType;
  oneToMany?: boolean;
}

export interface EntityType {

  name: string | { singular: string; plural: string };

  fields: (string | FieldType | FieldTemplateType)[];

  data?: {
    /**
     * Restricciones de la entidad, como `PRIMARY KEY` o `FOREIGN KEY`.
     *
     * Si no se encuentra ninguna restricción para la clave primaria, se creará automáticamente del campo autoincrement.
     */
    constraints: any[];
  };

  relations: EntityRelationType[];

}


// ---------------------------------------------------------------------------------------------------
//  Project
// ---------------------------------------------------------------------------------------------------

export type DatabaseEngine = 'MySQL' | 'MariaDB' | 'MSSQL' | 'Oracle' | 'PostgreSQL';

export interface DataConnectionType {
  host: string;
  user: string;
  password: string;
  charset: CharsetType;
  schema: string;
}

export type EnvironmentModeType = 'dev' | 'pre' | 'pro';

export interface EnvironmentType {
  mode: EnvironmentModeType;
  subdomain?: string;
  url?: string;
  database: DataConnectionType;
  ftp?: FtpConnectionType;
  api?: {
    url?: string | { folder: string };
  };
}

export interface FtpConnectionType {
  host: string;
  protocol: string;
  port?: number;
  user: string;
  password: string;
  remotePath?: string;
}

export interface ProjectType {

  name: string;

  /** Definición de las entidades que participan en el proyecto. */
  model: EntityType[];

  /** Definición del servidor de _backend_. */
  server?: {

    /** Domnio */
    domain: {
      name: string;
      ssl: boolean;
    };

    /** Entornos de desarrollo y producción */
    environments: EnvironmentType[];

    /** Definición comnún de la base de datos. */
    database: {
      engine: DatabaseEngine;
    };

    /** Definición común de la api. */
    api?: {
    };

    smtp?: any;
  };

  front?: any;
}


// ---------------------------------------------------------------------------------------------------
