import { Injectable, OnDestroy } from '@angular/core';
import { DeviceOrientation, DeviceOrientationCompassHeading } from '@ionic-native/device-orientation/ngx';

import { Subscription, of } from 'rxjs';
import { AppConfig } from 'src/core/app-config';

import { DevicePlugin } from './device';

/**
 * Wrapper para el plugin `Motion`.
 *
 *
 * **Cordova**
 *
 * - Repo: {@link https://ionicframework.com/docs/native/device-orientation}
 *
 * ```bash
 * npm install cordova-plugin-device-orientation
 * npm install @ionic-native/device-orientation
 * ionic cap sync
 * ```
 *
 * In app.module.ts
 * ```typescript
 * providers: [
 *  DeviceOrientation,
 * ]
 * ```
 * In file.ts
 * ```typescript
 * import { MotionPlugin } from 'src/core/native';
 * import { DeviceOrientationCompassHeading } from '@ionic-native/device-orientation/ngx';
 * constructor(public motion: MotionPlugin) { }
 *
 * // Get the device current compass heading
 *  this.motion.getCurrentOrientation().then(
 *    (results: DeviceOrientationCompassHeading) => console.log(results),
 *    (error: any) => console.log(error)
 *  );
 * ```
 * Data return
 * The heading in degrees from 0-359.99 at a single moment in time. (Number)
 * ```typescript
 * magneticHeading: number;
 * ```
 *
 * The heading relative to the geographic North Pole in degrees 0-359.99 at a single moment in time. A negative value indicates that the true heading can't be determined. (Number)
 * ```typescript
 * trueHeading: number;
 * ```
 *
 * The deviation in degrees between the reported heading and the true heading. (Number)
 * ```typescript
 * headingAccuracy: number;
 * ```
 *
 * The time at which this heading was determined. (DOMTimeStamp)
 * ```typescript
 * timestamp: number;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MotionPlugin {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public device: DevicePlugin,
    private deviceOrientation: DeviceOrientation
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

  }

  // Get the device current compass heading
  async getCurrentOrientation(): Promise<DeviceOrientationCompassHeading> {
    return this.device.ready().then(() => {
      if (this.device.isRealPhone) { return this.deviceOrientation.getCurrentHeading(); } else {
        return;
      }
    });
  }

}
