import { Injectable, OnDestroy } from '@angular/core';
import { Plugins, PluginResultError, AppState, AppLaunchUrl } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';


const { App } = Plugins;


/**
 * Wrapper para el plugin `FaceId`.
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitorjs.com/docs/apis/app}
 * - Examples : {@link https://medium.com/javascript-in-plain-english/opening-another-app-from-your-ionic-5-app-becf8c098d0e}
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { App } = Plugins;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AppPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor() {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Check if an app can be opened with the given URL */
  /** var ret = await App.canOpenUrl({ url: 'com.facebook.katana' }); */
  async canOpenUrl(options: { url: string }): Promise<{ value: boolean; }> {
    return App.canOpenUrl(options);
  }

  /** Open an app with the given URL. */
  /** var retx = await App.openUrl({ url:’com.facebook.katana' }); */
  async openUrl(options: { url: string; }): Promise<{ completed: boolean; }> {
    return App.openUrl(options);
  }

  /** Gets the current app state. */
  async getState(): Promise<AppState> {
    return App.getState();
  }

  /** Get the URL the app was launched with, if any */
  async getLaunchUrl(): Promise<AppLaunchUrl> {
    return App.getLaunchUrl();
  }

  /** 
   * Force exit the app. This should only be used in conjunction with the backButton handler for Android to exit the app when navigation is complete.
   *
   * Ionic handles this itself so you shouldn’t need to call this if using Ionic
   *
   * Returns: never
   */
  exitApp() {
    return App.exitApp();
  }

}
