import { Injectable } from '@angular/core';

import { AppConfig } from 'src/core/app-config';
import { DevicePlugin } from 'src/core/native';


@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  protected debug = true && AppConfig.debugEnabled;

  isRealAndroid = false;

  constructor(
    public device: DevicePlugin
  ) {
    this.device.ready().then(info => {
      this.isRealAndroid = this.device.isReal('android');
    });
  }

  /** Envía un mensaje a la consola y serializa los parámetros opcionales evitando las referencias circulares. */
  log(message?: string, ...optionalParams: any[]): void {
    const objects: any[] = this.stringifyObjects(optionalParams);
    if (objects.length) { console.log(message, ...objects); } else { console.log(message); }
  }

  /** Envía un mensaje de error a la consola y serializa los parámetros opcionales evitando las referencias circulares. */
  error(message?: string, ...optionalParams: any[]): void {
    const objects: any[] = this.stringifyObjects(optionalParams);
    if (objects.length) { console.error(message, ...objects); } else { console.error(message); }
  }

  /** Serializa los parámetros opcionales evitando las referencias circulares. */
  private stringifyObjects(optionalParams: any[]): string[] {
    const objects: any[] = [];
    const cache = [];

    if (AppConfig.stringifyEnabled || this.isRealAndroid) {

      for (const obj of optionalParams) {
        // objects.push(obj);
        objects.push(JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
              // Duplicate reference found, discard key
              return;
            }
            // Store value in our collection
            cache.push(value);
          }
          return value;
        }));
      }

    } else {
      objects.push(...optionalParams);
    }
    return objects;
  }

}
