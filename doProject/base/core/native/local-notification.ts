import { Injectable, OnDestroy } from '@angular/core';
import { LocalNotificationEnabledResult, Plugins, PluginListenerHandle, NotificationPermissionResponse } from '@capacitor/core';
import { ElectronService } from 'ngx-electron';

import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';


const { LocalNotifications } = Plugins;

/**
 * Wrapper para el plugin `Network`.
 *
 * **Capacitor**
 *
 * - Api: {@link https://capacitorjs.com/docs/apis/local-notifications}
 *
 * ```typescript
 * import { Plugins } from '@capacitor/core';
 * const { LocalNotifications } = Plugins;
 *
 * areEnabled();
 * requestPermission();
 * send(title: string, message: string);
 * addListenerlocalNotificationReceived()
 * addListenerlocalNotificationActionPerformed()
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LocalNotificationPlugin implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    ///// public device: DevicePlugin,
    public electronService: ElectronService,
    public device: DevicePlugin,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    this.device.ready().then(() => {

      this.areEnabled().then(response => {
        if (this.debug) { console.log(this.constructor.name + '.areEnabled', response); }
        if (response) {
          this.requestPermission().then(granted => {
            if (this.debug) {
              if (this.debug) { console.log(this.constructor.name + '.requestPermission', granted); }
            }
          });
        }
      });

      this.addListenerlocalNotificationActionPerformed((notification) => {
        if (this.debug) { console.log(this.constructor.name + '.addListenerlocalNotificationActionPerformed: ', notification); }
      });

      this.addListenerlocalNotificationReceived((notification) => {
        if (this.debug) { console.log(this.constructor.name + '.addListenerlocalNotificationReceived: ', notification); }
      });
    });

  }

  ngOnDestroy(): void {
    LocalNotifications.removeAllListeners();
  }

  addListenerlocalNotificationReceived(callback: (notification: any) => void): PluginListenerHandle {
    return LocalNotifications.addListener('localNotificationReceived', callback);
  }
  addListenerlocalNotificationActionPerformed(callback: (notificationAction: any) => void): PluginListenerHandle {
    // this.electronService.
    return LocalNotifications.addListener('localNotificationActionPerformed', callback);
  }

  areEnabled(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.electronService.isElectronApp) { return resolve(false); }
      LocalNotifications.areEnabled().then((response: LocalNotificationEnabledResult) => {
        resolve(response.value);
      });
    });
  }

  requestPermission(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.electronService.isElectronApp) { return resolve(false); }
      LocalNotifications.requestPermission().then((response: NotificationPermissionResponse) => {
        resolve(response.granted);
      });
    });
  }

  push(idNotification: number, title: string, message: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.electronService.isElectronApp) {
        LocalNotifications.schedule({
          notifications: [
            {
              title,
              body: message,
              id: idNotification,
              schedule: { at: new Date(Date.now() + 5000) },
              sound: null,
              attachments: null,
              actionTypeId: '',
              extra: null
            }
          ]
        }).then(() => { resolve(true); });
      }
    });
  }
}
