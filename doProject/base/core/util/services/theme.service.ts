import { Injectable, Inject, ComponentFactoryResolver } from '@angular/core';
import { DomController, ModalController } from '@ionic/angular';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import { defaultLightTheme } from 'src/assets/themes/light/default/theme';
import { defaultDarkTheme } from 'src/assets/themes/dark/default/theme';

import { AppConfig } from 'src/core/app-config';
import { StoragePlugin, StatusBarPlugin, DevicePlugin } from 'src/core/native';

import { ConsoleService } from './console.service';
import { capitalize } from '../ts-utils';


export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeScheme {
  mode: ThemeMode; // 'light' | 'dark'
  name: string;    // 'silver' | 'night' | 'ocean' | ...
  style: {
    root: { [key: string]: string };
    ios?: { [key: string]: string };
    md?: { [key: string]: string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  static storageKey = 'app_theme';
  static preferredMode: 'light' | 'dark' = 'dark';
  private debug = true && AppConfig.debugEnabled;

  // current
  private currentLight: ThemeScheme | undefined;
  private currentDark: ThemeScheme | undefined;
  currentStatusBarVisibility = true;
  currentMode: ThemeMode = 'system';
  /** Indica cuando un dispositivo no permite la detección por sistema del cambio de modo. */
  matchMediaAvailable = true;


  /** Lista de temas diponibles. Ej: [ { name: 'ocean', mode: 'light' } ] */
  availables: ThemeScheme[] = [defaultLightTheme, defaultDarkTheme];
  get lightAvailables() { return this.availables.filter(t => t.mode === 'light'); }
  get darkAvailables() { return this.availables.filter(t => t.mode === 'dark'); }

  bgHeaderColor: string;

  /** Notifica el cambio de tema. */
  changed: BehaviorSubject<ThemeScheme | undefined> | undefined;

  /** Control de componentes para statusBar. */
  checkdComponents = {
    current: undefined,
    previous: undefined,
  };

  constructor(
    public storage: StoragePlugin,
    public statusBar: StatusBarPlugin,
    public device: DevicePlugin,
    public console: ConsoleService,
    public resolver: ComponentFactoryResolver,
    public modal: ModalController,
    private domCtrl: DomController, @Inject(DOCUMENT) private document
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor() -> AppConfig =>', AppConfig); }

  }

  /** Establece los temas disponibles e intenta cargar la info del storage. */
  initialize(availables?: ThemeScheme[]): void {

    // Cargamos los temas suministrados programáticamente.
    if (Array.isArray(availables)) { this.availables.push(...availables.filter(t => !this.availables.find(c => c.name === t.name && c.mode === t.mode))); }
    // Establecemos un tema por defecto para cada modo.
    this.currentLight = defaultLightTheme;
    this.currentDark = defaultDarkTheme;
    // Intentamos cargar los temas del storage.
    this.storage.get(ThemeService.storageKey).then((stored: any) => {
      // if (this.debug) { console.log(this.constructor.name + '.initialize() -> get stored theme => ', stored); }
      if (stored) {
        if (this.debug) { this.console.log(this.constructor.name + '.initialize => stored', stored); }
        this.currentMode = stored.mode;
        this.light = this.findTheme(stored.light, 'light');
        this.dark = this.findTheme(stored.dark, 'dark');
        this.currentStatusBarVisibility = stored.statusBarVisible || true;
      }
      if (this.debug) { this.console.log(this.constructor.name + '.initialize => this.currentStatusBarVisibility ', this.currentStatusBarVisibility); }

    }).catch(() => {
      // Evitamos el error de uncatch.
    }).finally(() => {
      // Establecemos el tema actual.
      this.setTheme(this.current);
      // Inicializamos el notificador.
      this.changed = new BehaviorSubject(this.current);
    });

    // Detectamos los cambios de modo del sistema.
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener<'change'>('change', (mediaQuery: MediaQueryListEvent) => {
        // if (this.debug) { console.log(this.constructor.name + '.matchMedia().addEventListener(mediaQuery) => ', mediaQuery); }
        if (this.currentMode === 'system') {
          this.current = mediaQuery.matches ? this.currentDark : this.currentLight;
        }
      });
    } catch (error) {
      this.matchMediaAvailable = false;
      if (this.currentMode === 'system') { this.mode = ThemeService.preferredMode; }
      this.console.error(error);
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  mode
  // ---------------------------------------------------------------------------------------------------

  /** Resuelve el modo actual en `light` o `dark` en función del valor actual de `currentMode`. */
  get mode(): ThemeMode {
    try {
      return this.currentMode === 'system' && this.matchMediaAvailable
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : this.currentMode
        ;

    } catch (error) {
      this.console.error(error);
      this.matchMediaAvailable = false;
      if (this.currentMode === 'system') { this.mode = ThemeService.preferredMode; }
      return this.currentMode;
    }
  }

  /** Establece el modo actual y lo guarda en el storage. Si el modo ha cambiado también actualiza el tema y lo notifica. */
  set mode(mode: ThemeMode) {
    const oldMode = this.mode;
    this.currentMode = mode;
    this.saveStorage();
    if (this.mode !== oldMode) {
      this.setTheme(this.current);
      this.changed.next(this.current);
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  light . dark . current
  // ---------------------------------------------------------------------------------------------------

  /** Devuelve el tema actual del modo `dark`. */
  get dark(): ThemeScheme { return this.currentDark; }
  set dark(theme: ThemeScheme) { if (theme) { this.currentDark = theme; } }

  /** Devuelve el tema actual del modo `light`. */
  get light(): ThemeScheme { return this.currentLight; }
  set light(theme: ThemeScheme) { if (theme) { this.currentLight = theme; } }

  /** Devuelve el tema del modo actual. */
  get current(): ThemeScheme {
    const theme = this.mode === 'light' ? this.currentLight : this.currentDark;
    return theme;
  }
  /** Establece el tema del modo. */
  set current(theme: ThemeScheme) {
    // if (this.debug) { console.log(this.constructor.name + '.set current = ', theme); }
    if (this.findTheme(theme, theme.mode)) {
      // if (this.debug) { console.log('set current theme => ', theme); }
      this[`current${capitalize(theme.mode)}`] = theme;
      if (theme.mode === this.mode) { this.setTheme(theme); }
      this.saveStorage();
      if (this.changed) { this.changed.next(this.current); }
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  findTheme . setTheme
  // ---------------------------------------------------------------------------------------------------

  /** Busca el tema con nombre para el modo indicado. Si no se indica un modo se utiliza el modo actual. */
  findTheme(theme: string | ThemeScheme, mode?: ThemeMode): ThemeScheme {
    mode = mode || this.mode;
    if (typeof theme === 'string') {
      theme = this.availables.find(t => t.name === theme && t.mode === mode);
    } else {
      theme = this.availables.find(t => t.name === (theme as ThemeScheme).name && t.mode === mode);
    }
    return theme;
  }

  /** Establece el tema indicado. */
  setTheme(theme: ThemeScheme): void {
    if (theme) {
      // Aplicamos el tema.
      this.domCtrl.write(() => {
        // Referenciamos el cuerpo del document.
        const body = document.querySelector('body');
        const list: DOMTokenList = body.classList;
        if (this.mode === 'dark') {
          list.add('dark');
        } else {
          list.remove('dark');
        }
        // Aplicamos el tema raíz.
        this.applyStyle(theme.style.root);
        // Sobrescribimos el tema raíz con el de la plataforma actual.
        this.device.ready().then(() => {
          if (this.device.is('ios') && !!theme.style.ios) { this.applyStyle(theme.style.ios); }
          if (this.device.is('android') && !!theme.style.md) { this.applyStyle(theme.style.md); }
        });
        // Establecemos la visibilidad de la barra de estado.
        this.statusBarVisible = this.currentStatusBarVisibility;
      });
    }
  }

  private applyStyle(style: { [key: string]: string }): void {
    Object.keys(style).map(prop => {
      if (prop === '--ion-header-color') { this.bgHeaderColor = style[prop]; }
      document.documentElement.style.setProperty(prop, style[prop]);
    });
  }

  /**
   * Devuelve el valor de una propiedad del estilo css actual.
   * ```typescript
   * const color = this.theme.getPropertyValue('--ion-text-color');
   * ```
   */
  getPropertyValue(property: string): string {
    return document.documentElement.style.getPropertyValue(property);
  }


  // ---------------------------------------------------------------------------------------------------
  //  saveStorage
  // ---------------------------------------------------------------------------------------------------

  /** Guarda el modo y los nombres de los temas para cada modo en el storage. */
  saveStorage() {
    this.storage.set(ThemeService.storageKey, {
      light: this.currentLight.name,
      dark: this.currentDark.name,
      mode: this.currentMode,
      statusBarVisible: this.currentStatusBarVisibility,
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  resource
  // ---------------------------------------------------------------------------------------------------

  /**
   * Obtiene el nombre del archivo en función del modo actual.
   *
   * ```html
   * <img [src]="theme.resource('login/logo.png')" />
   * ```
   * Si el modo es `dark` y el tema `silver` devuelve:
   * ```html
   * <img src="assets/themes/dark/silver/login/logo.png" />
   * ```
   */
  resource(resource: string): string {
    if (!resource) { return ''; }
    if (!this.availables) { return resource; }
    const path = `assets/themes/${this.mode}/${this.current.name}/${resource}`;
    return path;
  }


  // ---------------------------------------------------------------------------------------------------
  //  StatusBar
  // ---------------------------------------------------------------------------------------------------

  get statusBarVisible() { return this.currentStatusBarVisibility; }

  set statusBarVisible(show: boolean) {
    this.currentStatusBarVisibility = show;
    this.saveStorage();
    this.device.ready().then(() => {
      if (this.debug) { console.log(this.constructor.name + '.set statusBarVisible => this.device.isReal("android")', this.device.isReal('android')); }
      if (this.debug) { console.log(this.constructor.name + '.set statusBarVisible => overlay: !show', !show); }
      if (this.device.isReal('android')) {
        this.statusBar.setOverlaysWebView({ overlay: !show });
        if (!show) { this.statusBar.hide(); } else { this.statusBar.show(); }
      }
    });
  }

  /** Obtiene el color de fondo del header (ion-toolbar) y establece el color de texto ideal para la StatusBar.  */
  checkStatusBar(component?: any): void {
    // Si no se suministra un componente entonces suponemos que volvemos de un modal o un popover.
    if (component) {
      this.checkdComponents.previous = this.checkdComponents.current;
      this.checkdComponents.current = component;
    } else {
      this.checkdComponents.current = this.checkdComponents.previous;
    }
    if (!this.checkdComponents.current) { return; }

    const factory = this.resolver.resolveComponentFactory(this.checkdComponents.current.constructor);
    const element = document.getElementsByTagName(`${factory.selector}`)[0];
    let bgColor = this.findBackgroundColor(element);
    if (!bgColor) {
      // Un component de llista anidat dins una pàgina no té toolbar. Hem d'anar a buscar la del seu pare, la pàgina amb tabs que el conté.
      const content = element.closest('ion-content');
      if (!content) { return; }
      bgColor = this.findBackgroundColor(content.parentElement);
    }
    this.device.ready().then(() => {
      if (this.device.isReal('android')) {
        this.statusBar.setBackgroundColor({ color: bgColor });
        this.statusBar.setStatusBar(this.idealTextColor(bgColor) === '#000000' ? 'dark' : 'light');
      } else if (this.device.isReal('ios')) {
        this.statusBar.setStatusBar(this.idealTextColor(bgColor) === '#000000' ? 'light' : 'dark');
      }
    });
  }

  /** Cerca el component `ion-toolbar` del header del component i en retorna el color de fons. */
  private findBackgroundColor(element: any): any {
    const header = element.getElementsByTagName(`ion-header`)[0];
    const toolbar = header ? header.getElementsByTagName(`ion-toolbar`)[0] : element.getElementsByTagName(`ion-content`)[0];
    if (!toolbar) { return; }
    return (window.getComputedStyle(toolbar).getPropertyValue('--background') || '').trim();
  }

  /** Obté el color de text ideal per al color de fons indicat. */
  idealTextColor(bgColor: string): string {
    const nThreshold = 105;
    const components = this.getRGBComponents(bgColor);
    const bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
    return ((255 - bgDelta) < nThreshold) ? '#000000' : '#ffffff';
  }

  /** Decomposa un color hexadecimal en els seus components numèrics R, G, B. */
  private getRGBComponents(color: string): any {
    return {
      R: parseInt(color.substring(1, 3), 16),
      G: parseInt(color.substring(3, 5), 16),
      B: parseInt(color.substring(5, 7), 16),
    };
  }

  RGBToHex(rgb: any) {
    // Choose correct separator
    const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
    // Turn 'rgb(r,g,b)' into [r,g,b]
    rgb = rgb.substr(4).split(')')[0].split(sep);

    let r = (+rgb[0]).toString(16);
    let g = (+rgb[1]).toString(16);
    let b = (+rgb[2]).toString(16);

    if (r.length === 1) { r = '0' + r; }
    if (g.length === 1) { g = '0' + g; }
    if (b.length === 1) { b = '0' + b; }

    return '#' + r + g + b;
  }

  /** Indica si el component està anidat dins d'un modal. */
  private isModal(element: any): boolean {
    return !!element.closest('ion-modal');
  }

  /** Indica si el modal es mostra ocupant el 100% d'amplada de la pantalla. */
  private isFullModal(element: any): boolean {
    const modal = element.closest('ion-modal');
    return modal ? window.getComputedStyle(modal).getPropertyValue('--width') === '100%' : false;
  }

}
