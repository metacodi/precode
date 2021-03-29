import { Injectable, OnDestroy } from '@angular/core';
import { Plugins, KeyboardInfo, KeyboardStyleOptions, KeyboardResizeOptions, PluginListenerHandle } from '@capacitor/core';
import { Subject, of } from 'rxjs';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';


const { Keyboard } = Plugins;

/**
 * Wrapper para el plugin `Keyboard`.
 *
 * **Cordova**
 *
 * - Docs: {@link https://ionicframework.com/docs/native/keyboard}
 * - Repo: {@link https://github.com/ionic-team/cordova-plugin-ionic-keyboard}
 *
 * ```bash
 * ionic cordova plugin add cordova-plugin-ionic-keyboard
 * npm install @ionic-native/keyboard --save
 * ```
 * ```typescript
 * import { Keyboard } from '@ionic-native/keyboard/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitor.ionicframework.com/docs/apis/keyboard}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { Keyboard } = Plugins;
 *
 * Keyboard.setAccessoryBarVisible({isVisible: false});
 * Keyboard.show();
 * Keyboard.hide();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardPlugin implements OnDestroy  {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }


    this.device.ready().then(() => {
      // Actualizamos los teclados de los dispositivos móviles.
      if (this.device.isRealPhone) { Keyboard.setAccessoryBarVisible({ isVisible: false }); }
    });
  }

  ngOnDestroy(): void {
    this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { Keyboard.removeAllListeners(); }
    });
  }


  async addListenerWillShow(callback: (info: KeyboardInfo) => void): Promise<PluginListenerHandle> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return { remove: () => {} }; } else { return Keyboard.addListener('keyboardWillShow', callback); }
    });
  }

  async addListenerDidShow(callback: (info: KeyboardInfo) => void): Promise<PluginListenerHandle> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return { remove: () => {} }; } else { return Keyboard.addListener('keyboardDidShow', callback); }
    });
  }

  async addListenerWillHide(callback: () => void): Promise<PluginListenerHandle> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return { remove: () => {} }; } else { return Keyboard.addListener('keyboardWillHide', callback); }
    });
  }

  async addListenerDidHide(callback: () => void): Promise<PluginListenerHandle> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return { remove: () => {} }; } else { return Keyboard.addListener('keyboardDidHide', callback); }
    });
  }


  /** Set whether the accessory bar should be visible on the keyboard. We recommend disabling the accessory bar for short forms (login, signup, etc.) to provide a cleaner UI */
  async setAccessoryBarVisible(options: { isVisible: boolean }): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return Keyboard.setAccessoryBarVisible(options); }
    });
  }

  /** Programmatically set the keyboard style. */
  async setStyle(options: KeyboardStyleOptions): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return Keyboard.setStyle(options); }
    });
  }

  /** Programmatically set the resize mode. */
  async setResizeMode(options: KeyboardResizeOptions): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return Keyboard.setResizeMode(options); }
    });
  }

  /** Programmatically enable or disable the WebView scroll. */
  async setScroll(options: { isDisabled: boolean }): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return Keyboard.setScroll(options); }
    });
  }

  /** Show the keyboard. */
  async show(): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return Keyboard.show(); }
    });
  }

  /** Hide the keyboard. */
  async hide(): Promise<void> {
    return this.device.getInfo().then(value => {
      if (!this.device.isRealPhone) { return of(undefined).toPromise(); } else { return Keyboard.hide(); }
    });
  }

}
