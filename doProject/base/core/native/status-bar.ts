import { Injectable } from '@angular/core';
import { Plugins, StatusBarBackgroundColorOptions, StatusBarStyleOptions, StatusBarOverlaysWebviewOptions, StatusBarInfoResult, PluginListenerHandle, StatusBarStyle } from '@capacitor/core';
import { Platform } from '@ionic/angular';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';


const { StatusBar } = Plugins;

/**
 * Wrapper para el plugin `StatusBar`.
 *
 * **Cordova**
 *
 * ```typescript
 * import { StatusBar } from '@ionic-native/status-bar/ngx';
 * ```
 *
 * **Capacitor**
 *
 * - Api: https://capacitor.ionicframework.com/docs/apis/status-bar
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { StatusBar } = Plugins;
 *
 * StatusBar.show();
 * StatusBar.hide();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class StatusBarPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** iOS only. */
  addListenerStatusTap(callback: () => void): PluginListenerHandle {
    return StatusBar.addListener('statusTap', callback);
  }

  /** Show the status bar. */
  show(): Promise<void> {
    return StatusBar.show();
  }

  /** Hide the status bar. */
  hide(): Promise<void> {
    return StatusBar.hide();
  }

  /** Set the background color of the status bar. */
  setBackgroundColor(options: StatusBarBackgroundColorOptions): Promise<void> {
    return StatusBar.setBackgroundColor(options);
  }

  /** Get info about the current state of the status bar. */
  getInfo(): Promise<StatusBarInfoResult> {
    return StatusBar.getInfo();
  }

  /** Set whether or not the status bar should overlay the webview to allow usage of the space around a device "notch". */
  setOverlaysWebView(options: StatusBarOverlaysWebviewOptions): Promise<void> {
    return StatusBar.setOverlaysWebView(options);
  }

  /** Set the current style of the status bar. */
  setStyle(options: StatusBarStyleOptions): Promise<void> {
    return StatusBar.setStyle(options);
  }

  setStatusBar(mode: 'light' | 'dark') {
    if (this.debug) { console.log(this.constructor.name + '.setStatusBar()'); }
    this.device.ready().then(() => {
      if (this.debug) { console.log(this.constructor.name + '.setStatusBar() => this.device.platform', this.device.platform); }
      if (this.device.isReal('ios')) {
        this.setStyle({ style: mode === 'light' ? StatusBarStyle.Light : StatusBarStyle.Dark });
      } else if (this.device.isReal('android')) {
        //  this.setStyle({ style: StatusBarStyle.Dark });
         this.setStyle({ style: mode === 'light' ? StatusBarStyle.Dark : StatusBarStyle.Light });
      }

      if (this.debug) { this.getInfo().then( info => { console.log(this.constructor.name + '.getInfo', JSON.stringify(info)); }); }
    }).catch(error => {
      if (this.debug) { console.log(this.constructor.name + '.setStatusBar() error =>', error); }
    });
  }

}
