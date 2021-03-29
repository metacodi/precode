import { Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FilesystemDirectory, GetUriResult, StatResult, StatOptions } from '@capacitor/core';

import { AppConfig } from 'src/config';
import { BlobService } from 'src/core/api';
import { MediaPlugin, FileSystemPlugin, FileSystemPluginDirectory } from 'src/core/native';

import { DeviceNotificationsSchema } from './device-notifications.schema';
import { DeviceSettingsComponent } from '../device-settings.component';



@Component({
  selector: 'app-device-notifications',
  templateUrl: 'device-notifications.page.html',
  styleUrls: ['device-notifications.page.scss'],
})
export class DeviceNotificationsPage extends DeviceSettingsComponent implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  settings = 'notifications';

  notificationsSettings: any;

  urlFile: any;

  constructor(
    public injector: Injector,
    public blob: BlobService,
    public media: MediaPlugin,
    public fileSystem: FileSystemPlugin,
  ) {
    super(injector, DeviceNotificationsSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.blob.get('notificationsSettings').then(behavior => this.subscriptions.push(behavior.subscribe(value => this.notificationsSettings = value)));
  }

  ngOnDestroy(): void {
    if (this.debug) { console.log(this.constructor.name + 'ngOnDestroy'); }
    super.ngOnDestroy();
  }

  async trySound() {
    if (this.row && this.row?.sonidoPush) {
      if (this.debug) { console.log(this.constructor.name + '.trySound', this.row.sonidoPush); }
      if (this.media.isPlay) {
        this.media.stop();
      } else {
        this.media.play({ src: 'audio/' + this.row.sonidoPush }).then(results => this.urlFile = results);
      }
    }
  }

}
