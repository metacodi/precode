import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Media, MediaObject } from '@ionic-native/media/ngx';

import { DevicePlugin } from './device';

import { AppConfig } from 'src/core/app-config';

/**
 * Wrapper para el plugin `Media`.
 *
 * **Cordova**
 *
 *  - API:{@link https://ionicframework.com/docs/native/media} 
 * ```typescript
 * import { Media, MediaObject } from '@ionic-native/media/ngx';
 * ```
 * * Add on app.modules.ts
 * 
 * import { Media } from '@ionic-native/media/ngx';
 * 
 * providers: [
 *   Media,
 * ],
 */
@Injectable({
  providedIn: 'root'
})
export class MediaPlugin {
  protected debug = true && AppConfig.debugEnabled;

  file: MediaObject;
  soundPlay: any;
  isPlay = false;
  constructor(
    private media: Media,
    public device: DevicePlugin
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  /** Create a media and play. 
   * @param string src — A URI containing the audio content.
   * If audio file is on 'assets', example: 'audio/file.mp3'
   * @iosOptions : {
   *   @numberOfLoops ?: number;
   *   @playAudioWhenScreenIsLocked ?: boolean;
   * }
   * @external boolean:false default
   */
  play(options: { src: string, iosOptions?: { numberOfLoops?: number; playAudioWhenScreenIsLocked?: boolean; }, external?: boolean }): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        this.device.getInfo().then(value => {
          if (this.device.isRealPhone) {
            let localUrl = '';
            if (!options.external) {
              if (this.device.is('android')) {
                localUrl = '/android_asset/public/assets/';
              } else if (this.device.is('ios')) {
                localUrl = 'assets/';
              }
            }
            this.file = this.media.create(localUrl + options.src);
            this.file.onSuccess.subscribe(() => this.isPlay = false);
            this.file.play(options.iosOptions);
            this.isPlay = true;
            resolve(localUrl + options.src);
          } else if (this.device.is('electron')) {
            if (!options.external) {
              const pathApp = this.device.electronService.remote.app.getPath('exe');
              const soundplayer = this.device.electronService.remote.require('sound-player');
              const path = this.device.electronService.remote.require('path');
              let urlMp3 = '';
              if (this.device.electronService.isMacOS) {
                urlMp3 = path.join(pathApp, '../../assets/', options.src);
              } else if (this.device.electronService.isWindows) {
                urlMp3 = path.join(pathApp, '../assets/', options.src);
              }
              // console.log(urlMp3);
              const optionsSoundplayer = {
                filename: urlMp3,
                gain: 10,
                debug: false,
              }
              this.soundPlay = new soundplayer(optionsSoundplayer);
              this.soundPlay.play();
              const self = this;
              this.soundPlay.on('complete', () => self.isPlay = false);
              this.isPlay = true;
              resolve(urlMp3);
            } else {
              this.soundPlay.play(options.src);
            }
          }
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /** Media object has completed the current play, record, or stop action. */
  onSuccess(): Observable<any> {
    this.isPlay = false;
    return this.file.onSuccess;
  }

  /** Indicate status changes. It takes a integer status code
   * Media.MEDIA_NONE = 0;
   * Media.MEDIA_STARTING = 1;
   * Media.MEDIA_RUNNING = 2;
   * Media.MEDIA_PAUSED = 3;
   * Media.MEDIA_STOPPED = 4;
   */
  onStatusUpdate(): Observable<any> {
    return this.file.onStatusUpdate;
  }

  /** If an error occurs. It takes an integer error code */
  onError(): Observable<any> {
    return this.file.onError;
  }

  /** Sets the current position within an audio file.
   * @param milliseconds — The time position you want to set for the current audio file.
   */
  seekTo(milliseconds: number): void {
    this.file.seekTo(milliseconds);
  }

  /** Stop an audio file. */
  stop(): void {
    this.isPlay = false;
    this.device.getInfo().then(value => {
      if (this.device.isRealPhone) {
        this.file.stop();
      } else if (this.device.is('electron')) {
        this.soundPlay.stop();
      }
    });
  }

  /** Set the volume for an audio file.
   * @param volume — The volume to set for playback. The value must be within the range of 0.0 to 1.0.
  */
  setVolume(volume: number): void {
    this.file.setVolume(volume);
  }

  /** Get the duration of an audio file in seconds. If the duration is unknown, it returns a value of -1.
   * @returns — Returns the duration of an audio file.
  */
  getDuration(): number {
    return this.file.getDuration();
  }

  /** Get the current position within an audio file. Also updates the Media object's position parameter.
   * @returns — Returns a promise with the position of the current recording.
  */
  getCurrentPosition(): Promise<any> {
    return this.file.getCurrentPosition();
  }

}
